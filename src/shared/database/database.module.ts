import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

/** 提供运行时 TypeORM 数据库连接。 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.getOrThrow<string>('database.host'),
        port: config.getOrThrow<number>('database.port'),
        username: config.getOrThrow<string>('database.username'),
        password: config.get<string>('database.password', ''),
        database: config.getOrThrow<string>('database.database'),
        entities: [
          `${process.cwd()}/dist/**/*.entity.js`,
          `${process.cwd()}/src/**/*.entity.ts`,
        ],
        migrations: [`${process.cwd()}/dist/database/migrations/*.js`],
        synchronize: false,
        charset: 'utf8mb4',
        timezone: 'Z',
        namingStrategy: new SnakeNamingStrategy(),
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
