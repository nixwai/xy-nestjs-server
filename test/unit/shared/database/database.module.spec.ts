import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { createDatabaseOptions } from '#/shared/database/database.module.js';

describe('createDatabaseOptions', () => {
  it('lets Nest initialize the database before module initialization', () => {
    const config = {
      getOrThrow: (key: string) =>
        ({
          'database.host': 'mysql.internal',
          'database.port': 3306,
          'database.username': 'admin',
          'database.database': 'app'
        })[key],
      get: (_key: string, fallback: string) => fallback
    } as unknown as ConfigService;

    expect(createDatabaseOptions(config)).toMatchObject({
      autoLoadEntities: true,
      synchronize: false
    });
  });
});
