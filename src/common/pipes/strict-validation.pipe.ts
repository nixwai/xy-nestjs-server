import type { ValidationError } from '@nestjs/common';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

/** 创建统一的严格请求参数校验管道。 */
export function createStrictValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: errors =>
      new BadRequestException({
        message: formatValidationErrors(errors)
      })
  });
}

/** 保留 DTO 自定义消息，并将非白名单字段提示转换为中文。 */
function formatValidationErrors(errors: ValidationError[]): string[] {
  return errors.flatMap(error => {
    const messages = Object.entries(error.constraints ?? {}).map(([constraint, message]) =>
      constraint === 'whitelistValidation' ? `不允许提交字段：${error.property}` : message
    );
    const children = error.children?.length ? formatValidationErrors(error.children) : [];
    return [...messages, ...children];
  });
}
