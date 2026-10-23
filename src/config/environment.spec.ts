import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getEnvironmentFilePaths,
  resolveEnvironmentVariables,
} from './environment.js';

describe('environment loader', () => {
  it('loads development files from high to low precedence while preserving runtime values', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'yue-config-'));
    writeFileSync(join(cwd, '.env'), 'VALUE=base\nFROM_BASE=yes\n');
    writeFileSync(join(cwd, '.env.development'), 'VALUE=development\n');
    writeFileSync(
      join(cwd, '.env.development.local'),
      'VALUE=local\nFROM_LOCAL=yes\n',
    );

    expect(
      resolveEnvironmentVariables({
        cwd,
        environment: 'development',
        runtimeEnvironment: { NODE_ENV: 'development', VALUE: 'runtime' },
      }),
    ).toMatchObject({
      NODE_ENV: 'development',
      VALUE: 'runtime',
      FROM_BASE: 'yes',
      FROM_LOCAL: 'yes',
    });
  });

  it('does not include development files for test or production', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'yue-config-'));
    writeFileSync(join(cwd, '.env'), 'VALUE=development\n');
    writeFileSync(join(cwd, '.env.production'), 'VALUE=production\n');
    writeFileSync(join(cwd, '.env.test'), 'VALUE=test\n');

    expect(
      resolveEnvironmentVariables({
        cwd,
        environment: 'test',
        runtimeEnvironment: { NODE_ENV: 'test' },
      }).VALUE,
    ).toBe('test');
    expect(
      resolveEnvironmentVariables({
        cwd,
        environment: 'test',
        runtimeEnvironment: { NODE_ENV: 'test' },
      }).DEVELOPMENT_ONLY,
    ).toBeUndefined();
    expect(
      resolveEnvironmentVariables({
        cwd,
        environment: 'production',
        runtimeEnvironment: { NODE_ENV: 'production' },
      }).VALUE,
    ).toBeUndefined();
  });

  it('returns the documented file order', () => {
    const cwd = process.cwd();
    expect(getEnvironmentFilePaths('development', cwd)).toEqual([
      join(cwd, '.env.development.local'),
      join(cwd, '.env.development'),
      join(cwd, '.env'),
    ]);
    expect(getEnvironmentFilePaths('test', cwd)).toEqual([
      join(cwd, '.env.test.local'),
      join(cwd, '.env.test'),
    ]);
    expect(getEnvironmentFilePaths('production', cwd)).toEqual([]);
  });
});
