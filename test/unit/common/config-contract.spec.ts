import { describe, expect, it } from 'vitest';
import { loadBaseConfig, mergeConfig } from '#/common/utils/config.util.js';

describe('基础配置合并', () => {
  it('深度合并嵌套配置且不修改输入对象', () => {
    const base = { database: { host: 'localhost', port: 3306 } };
    const override = { database: { port: 3307 } };
    expect(mergeConfig(base, override)).toEqual({ database: { host: 'localhost', port: 3307 } });
    expect(base).toEqual({ database: { host: 'localhost', port: 3306 } });
  });

  it('加载仓库基础配置并保留应用和数据库默认契约', () => {
    expect(loadBaseConfig()).toMatchObject({
      app: { environment: 'development', globalPrefix: 'api' },
      database: { enabled: true }
    });
  });
});
