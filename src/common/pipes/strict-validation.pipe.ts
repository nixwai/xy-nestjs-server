import { ValidationPipe } from '@nestjs/common';

/** 创建统一的严格请求参数校验管道。 */
export function createStrictValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
}
