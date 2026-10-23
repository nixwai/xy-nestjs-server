import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import dotenv from 'dotenv';
import type { AppEnvironment } from './config.types.js';

/** 环境文件加载选项。 */
export interface EnvironmentLoaderOptions {
  cwd?: string;
  environment?: AppEnvironment;
  runtimeEnvironment?: NodeJS.ProcessEnv;
}

const APP_ENVIRONMENTS: readonly AppEnvironment[] = [
  'development',
  'test',
  'production',
];

/** 返回环境文件的优先级顺序，数组前面的文件优先级更高。 */
export function getEnvironmentFilePaths(
  environment: AppEnvironment,
  cwd = process.cwd(),
): string[] {
  if (environment === 'production') return [];
  if (environment === 'test') {
    return [join(cwd, '.env.test.local'), join(cwd, '.env.test')];
  }
  return [
    join(cwd, '.env.development.local'),
    join(cwd, '.env.development'),
    join(cwd, '.env'),
  ];
}

/** 解析环境文件并生成运行时配置，不修改进程环境。 */
export function resolveEnvironmentVariables({
  cwd = process.cwd(),
  environment,
  runtimeEnvironment = process.env,
}: EnvironmentLoaderOptions = {}): Record<string, string> {
  const resolvedEnvironment = resolveEnvironmentName(
    environment ?? runtimeEnvironment.NODE_ENV,
  );
  const fileValues: Record<string, string> = {};

  for (const filePath of getEnvironmentFilePaths(
    resolvedEnvironment,
    cwd,
  ).reverse()) {
    if (!existsSync(filePath)) continue;
    Object.assign(fileValues, dotenv.parse(readFileSync(filePath, 'utf8')));
  }

  return {
    ...fileValues,
    ...toStringRecord(runtimeEnvironment),
    NODE_ENV:
      runtimeEnvironment.NODE_ENV ?? fileValues.NODE_ENV ?? resolvedEnvironment,
  };
}

/** 加载当前环境配置，并让运行时环境变量保持最高优先级。 */
export function loadEnvironment(
  options: Omit<EnvironmentLoaderOptions, 'runtimeEnvironment'> = {},
): NodeJS.ProcessEnv {
  const values = resolveEnvironmentVariables(options);
  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return process.env;
}

/** 判断给定值是否为受支持的应用环境。 */
export function isAppEnvironment(value: unknown): value is AppEnvironment {
  return (
    typeof value === 'string' &&
    APP_ENVIRONMENTS.includes(value as AppEnvironment)
  );
}

function resolveEnvironmentName(value: unknown): AppEnvironment {
  if (value === undefined || value === '') return 'development';
  if (isAppEnvironment(value)) return value;
  throw new Error(`不支持的运行环境：${JSON.stringify(value)}`);
}

function toStringRecord(
  environment: NodeJS.ProcessEnv,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(environment).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );
}
