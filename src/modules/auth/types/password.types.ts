/** scrypt 密码派生结果。 */
export interface PasswordHash {
  /** 派生密钥的十六进制摘要。 */
  hash: string;

  /** 十六进制随机盐。 */
  salt: string;
}
