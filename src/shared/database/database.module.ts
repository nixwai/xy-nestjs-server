import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

/** 构建运行时 TypeORM 数据源配置。 */
export function createDatabaseOptions(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'mysql' as const,
    host: config.getOrThrow<string>('database.host'),
    port: config.getOrThrow<number>('database.port'),
    username: config.getOrThrow<string>('database.username'),
    password: config.get<string>('database.password', ''),
    database: config.getOrThrow<string>('database.database'),
    autoLoadEntities: true,
    migrations: [`${process.cwd()}/dist/database/migrations/*.js`],
    synchronize: false,
    charset: 'utf8mb4',
    timezone: 'Z',
    namingStrategy: new SnakeNamingStrategy()
  };
}

/** 提供运行时 TypeORM 数据库连接。 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createDatabaseOptions
    })
  ],
  exports: [TypeOrmModule]
})
export class DatabaseModule {}
