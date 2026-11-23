import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '#/app.module.js';

/** 创建供 OpenAPI 生成脚本复用的应用测试模块。 */
export function createTestModule(): TestingModuleBuilder {
  return Test.createTestingModule({ imports: [AppModule] });
}
