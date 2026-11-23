import { loadEnvironment } from '../src/config/environment.js';

/** 为测试进程加载隔离的环境配置，并关闭真实数据库连接。 */
loadEnvironment({ environment: 'test' });
process.env.NODE_ENV = 'test';
process.env.DB_ENABLED = 'false';
