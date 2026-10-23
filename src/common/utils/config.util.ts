import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as yaml from 'js-yaml';

/** YAML 配置对象类型。 */
export type ConfigRecord = Record<string, unknown>;

/** 递归合并配置对象，数组和标量值由后者覆盖。 */
export function mergeConfig(
  base: ConfigRecord,
  override: ConfigRecord,
): ConfigRecord {
  const result: ConfigRecord = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    result[key] =
      isConfigRecord(current) && isConfigRecord(value)
        ? mergeConfig(current, value)
        : value;
  }
  return result;
}

/** 加载仓库内唯一的基础 YAML 配置模板。 */
export function loadBaseConfig(cwd = process.cwd()): ConfigRecord {
  const parsed = yaml.load(
    readFileSync(join(cwd, 'config', 'config.yaml'), 'utf8'),
  );
  return isConfigRecord(parsed) ? parsed : {};
}

function isConfigRecord(value: unknown): value is ConfigRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
