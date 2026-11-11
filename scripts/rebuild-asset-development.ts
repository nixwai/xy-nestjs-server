import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Migration, MigrationExecutor } from 'typeorm';
import type { DataSource } from 'typeorm';
import { CreateAssetManagement1794003000000 } from '../src/database/migrations/1794003000000-CreateAssetManagement.js';

interface AssetRebuildSafety {
  environment: string | undefined;
  host: string;
  database: string;
  confirmedDatabase: string | undefined;
  maintenanceConfirmed: boolean;
}

/** 仅允许显式确认且处于维护窗口的本地开发库，不接受远程或生产目标。 */
export function assertSafeAssetRebuild(input: AssetRebuildSafety): void {
  if (
    input.environment !== 'development' ||
    !['localhost', '127.0.0.1', '::1'].includes(input.host) ||
    !input.database.trim() ||
    ['mysql', 'information_schema', 'performance_schema', 'sys'].includes(input.database.toLowerCase()) ||
    /prod|production/i.test(input.database) ||
    input.confirmedDatabase !== input.database ||
    !input.maintenanceConfirmed
  ) {
    throw new Error('拒绝重建：必须为本地开发库、精确确认库名，并确认已停止所有应用写入');
  }
}

/** 不连接真实数据库的测试可注入 DataSource；仅重建最后一条素材迁移。MySQL DDL 无法事务回滚。 */
export async function rebuildDevelopmentAssets(
  dataSource: DataSource,
  safety: AssetRebuildSafety,
  backupRoot: string
): Promise<void> {
  assertSafeAssetRebuild(safety);
  if (
    dataSource.options.type !== 'mysql' ||
    dataSource.options.host !== safety.host ||
    dataSource.options.database !== safety.database
  ) {
    throw new Error('数据源与已确认目标不一致');
  }
  const runner = dataSource.createQueryRunner();
  const migration = new CreateAssetManagement1794003000000();
  let locked = false;
  try {
    await runner.connect();
    const lock: { acquired: number }[] = await runner.query(
      "SELECT GET_LOCK('asset-development-rebuild', 0) AS acquired"
    );
    if (Number(lock[0]?.acquired) !== 1) throw new Error('已有素材重建在运行');
    locked = true;
    const executor = new MigrationExecutor(dataSource, runner);
    const executed = await executor.getExecutedMigrations();
    const latest = [...executed].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0];
    if (latest?.name !== migration.name || latest.timestamp !== 1794003000000)
      throw new Error('最后已执行迁移不是素材迁移，拒绝回滚');
    const newest = [...dataSource.migrations].sort(
      (a, b) => Number((b.name ?? b.constructor.name).slice(-13)) - Number((a.name ?? a.constructor.name).slice(-13))
    )[0];
    if ((newest?.name ?? newest?.constructor.name) !== migration.name)
      throw new Error('素材迁移不是项目最新迁移，拒绝重建');
    const incoming: unknown[] = await runner.query(
      "SELECT TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IN ('asset_folder','asset_image') AND TABLE_NAME NOT IN ('asset_folder','asset_image')"
    );
    if (incoming.length) throw new Error('存在其他表引用素材表，拒绝重建');
    await runner.startTransaction('REPEATABLE READ');
    const folders: unknown[] = await runner.query('SELECT * FROM `asset_folder`');
    const images: { storage_key: string }[] = await runner.query('SELECT * FROM `asset_image`');
    const folderSchema: unknown[] = await runner.query('SHOW CREATE TABLE `asset_folder`');
    const imageSchema: unknown[] = await runner.query('SHOW CREATE TABLE `asset_image`');
    const directory = resolve(
      backupRoot,
      `asset-${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID()}`
    );
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const fileOptions = { encoding: 'utf8' as const, flag: 'wx', mode: 0o600 };
    await writeFile(
      resolve(directory, 'asset-backup.json'),
      JSON.stringify({ database: safety.database, migration: latest, folderSchema, imageSchema, folders, images }),
      fileOptions
    );
    await writeFile(
      resolve(directory, 'oss-keys.json'),
      JSON.stringify([...new Set(images.map(item => item.storage_key))]),
      fileOptions
    );
    await runner.commitTransaction();
    await writeFile(resolve(directory, 'backup-complete'), new Date().toISOString(), fileOptions);
    await migration.down(runner);
    await executor.deleteMigration(latest);
    await executor.executeMigration(new Migration(undefined, 1794003000000, migration.name, migration));
    await writeFile(resolve(directory, 'rebuild-complete'), new Date().toISOString(), fileOptions);
  } finally {
    try {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
    } finally {
      try {
        if (locked) await runner.query("SELECT RELEASE_LOCK('asset-development-rebuild')");
      } finally {
        await runner.release();
      }
    }
  }
}

async function main(): Promise<void> {
  // 缺少显式参数时，不加载环境文件、不初始化数据源。
  const confirmedDatabase = process.argv
    .find(arg => arg.startsWith('--confirm-database='))
    ?.split('=')
    .slice(1)
    .join('=');
  const maintenanceConfirmed = process.argv.includes('--writers-stopped');
  if (process.env.NODE_ENV !== 'development' || !confirmedDatabase || !maintenanceConfirmed) {
    throw new Error('需要 NODE_ENV=development、--confirm-database=<开发库名>、--writers-stopped');
  }
  const { default: dataSource } = await import('../src/data-source.js');
  const options = dataSource.options;
  if (options.type !== 'mysql') throw new Error('仅支持 MySQL');
  const safety = {
    environment: process.env.NODE_ENV,
    host: options.host ?? '',
    database: typeof options.database === 'string' ? options.database : '',
    confirmedDatabase,
    maintenanceConfirmed
  };
  assertSafeAssetRebuild(safety);
  try {
    await dataSource.initialize();
    await rebuildDevelopmentAssets(dataSource, safety, resolve('.temp/asset-backups'));
    console.info('素材迁移已重建，备份及OSS key清单保存在 .temp/asset-backups；未删除OSS对象。');
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(() => {
    console.error('素材重建失败；已停止后续操作。请检查安全条件及本地备份，MySQL DDL 不支持事务回滚。');
    process.exitCode = 1;
  });
}
