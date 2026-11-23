import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getEnvironmentFilePaths, resolveEnvironmentVariables } from '#/config/environment.js';

describe('环境配置文件解析', () => {
  it('按环境文件优先级合并，并让运行时变量覆盖文件值', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'xy-env-'));
    writeFileSync(join(cwd, '.env'), 'VALUE=base\nFROM_BASE=yes\n');
    writeFileSync(join(cwd, '.env.development'), 'VALUE=development\n');
    writeFileSync(join(cwd, '.env.development.local'), 'VALUE=local\nFROM_LOCAL=yes\n');

    expect(
      resolveEnvironmentVariables({
        cwd,
        environment: 'development',
        runtimeEnvironment: { NODE_ENV: 'development', VALUE: 'runtime' }
      })
    ).toMatchObject({ NODE_ENV: 'development', VALUE: 'runtime', FROM_BASE: 'yes', FROM_LOCAL: 'yes' });
  });

  it('测试和生产环境不读取开发环境文件', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'xy-env-'));
    writeFileSync(join(cwd, '.env'), 'VALUE=development\n');
    writeFileSync(join(cwd, '.env.test'), 'VALUE=test\n');

    expect(
      resolveEnvironmentVariables({ cwd, environment: 'test', runtimeEnvironment: { NODE_ENV: 'test' } })
    ).toMatchObject({
      VALUE: 'test',
      NODE_ENV: 'test'
    });
    expect(
      resolveEnvironmentVariables({ cwd, environment: 'production', runtimeEnvironment: { NODE_ENV: 'production' } })
    ).toEqual({
      NODE_ENV: 'production'
    });
  });

  it('返回稳定的环境文件搜索顺序', () => {
    const cwd = 'C:/config';

    expect(getEnvironmentFilePaths('development', cwd)).toEqual([
      join(cwd, '.env.development.local'),
      join(cwd, '.env.development'),
      join(cwd, '.env')
    ]);
    expect(getEnvironmentFilePaths('test', cwd)).toEqual([join(cwd, '.env.test.local'), join(cwd, '.env.test')]);
    expect(getEnvironmentFilePaths('production', cwd)).toEqual([]);
  });

  it('拒绝不支持的环境名称', () => {
    expect(() => resolveEnvironmentVariables({ environment: 'staging' as never, runtimeEnvironment: {} })).toThrow(
      '不支持的运行环境'
    );
  });
});
