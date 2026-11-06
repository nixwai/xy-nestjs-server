import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as yaml from 'js-yaml';
import type { ConfigRecord } from '../types/index.js';
import { isRecord } from './type-guard.util.js';
/**
 * 递归合并配置对象，数组和标量值由后者覆盖。
 *
 * @param base - 基础配置对象。
 * @param override - 用于覆盖基础配置的对象。
 * @returns 合并后的新配置对象。
 */
export function mergeConfig(base: ConfigRecord, override: ConfigRecord): ConfigRecord {
  const result: ConfigRecord = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    result[key] = isRecord(current) && isRecord(value) ? mergeConfig(current, value) : value;
  }
  return result;
}

/**
 * 加载仓库内唯一的基础 YAML 配置模板。
 *
 * @param cwd - 仓库工作目录。
 * @returns 解析后的配置对象；模板为空或非对象时返回空对象。
 */
export function loadBaseConfig(cwd = process.cwd()): ConfigRecord {
  const parsed = yaml.load(readFileSync(join(cwd, 'config', 'config.yaml'), 'utf8'));
  return isRecord(parsed) ? parsed : {};
}
