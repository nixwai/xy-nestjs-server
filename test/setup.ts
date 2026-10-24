import { loadEnvironment } from '../src/config/environment.js';

/** 为测试进程加载隔离的环境配置。 */
loadEnvironment({ environment: 'test' });
process.env.NODE_ENV = 'test';
process.env.DB_ENABLED = 'false';
process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-chars';
