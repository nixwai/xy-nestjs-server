import { describe, expect, it } from 'vitest';
import { assertSafeAssetRebuild } from '../../../../../scripts/rebuild-asset-development.js';

describe('素材开发重建安全检查', () => {
  const safe = {
    environment: 'development',
    host: '127.0.0.1',
    database: 'yue',
    confirmedDatabase: 'yue',
    maintenanceConfirmed: true
  };
  it('只接受显式确认的本地开发数据库', () => {
    expect(() => assertSafeAssetRebuild(safe)).not.toThrow();
    for (const unsafe of [
      { environment: 'production' },
      { environment: 'test' },
      { host: 'db.internal' },
      { database: 'xy_production' },
      ...['mysql', 'information_schema', 'performance_schema', 'sys', ''].map(database => ({
        database,
        confirmedDatabase: database
      })),
      { confirmedDatabase: 'other_dev' },
      { maintenanceConfirmed: false }
    ])
      expect(() => assertSafeAssetRebuild({ ...safe, ...unsafe })).toThrow();
  });
});
