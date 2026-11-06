import { BadRequestException } from '@nestjs/common';
/** 管理员密码最小长度。 */
const PASSWORD_MIN_LENGTH = 8;
/** 管理员密码最大长度。 */
const PASSWORD_MAX_LENGTH = 72;
/**
 * 校验解密后的管理员密码规则。
 *
 * @param password - 待校验的明文密码。
 * @param label - 错误消息中使用的字段名称。
 * @throws 长度或字符组合不满足规则时抛出 BadRequestException。
 */
export function validatePassword(password: string, label = '密码'): void {
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new BadRequestException(`${label}长度不能少于${PASSWORD_MIN_LENGTH}个字符`);
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    throw new BadRequestException(`${label}长度不能超过${PASSWORD_MAX_LENGTH}个字符`);
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new BadRequestException(`${label}必须同时包含字母和数字`);
  }
}
