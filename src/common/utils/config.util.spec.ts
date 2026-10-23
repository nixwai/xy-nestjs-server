import { describe, expect, it } from 'vitest';
import { loadBaseConfig, mergeConfig } from './config.util.js';

describe('config utilities', () => {
  it('deep merges nested configuration without mutating inputs', () => {
    const base = { database: { host: 'localhost', port: 3306 } };
    const override = { database: { port: 3307 } };
    expect(mergeConfig(base, override)).toEqual({
      database: { host: 'localhost', port: 3307 },
    });
    expect(base).toEqual({ database: { host: 'localhost', port: 3306 } });
  });

  it('loads the single base YAML configuration', () => {
    const config = loadBaseConfig();
    expect(config.app).toMatchObject({
      environment: 'development',
      globalPrefix: 'api',
    });
    expect(config.database).toMatchObject({ enabled: true });
  });
});
