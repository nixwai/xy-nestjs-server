import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { buildApplicationConfig } from './config/configuration.js';
import { loadEnvironment } from './config/environment.js';

loadEnvironment();
const config = buildApplicationConfig();
const database = config.database;

/** TypeORM CLI 使用的数据源，禁止启用 synchronize。 */
export default new DataSource({
  type: 'mysql',
  host: database.host,
  port: database.port,
  username: database.username,
  password: database.password,
  database: database.database,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  charset: 'utf8mb4',
  timezone: 'Z',
  namingStrategy: new SnakeNamingStrategy()
});
