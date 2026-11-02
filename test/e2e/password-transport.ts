import { constants, publicEncrypt } from 'node:crypto';

/** 使用服务返回的 RSA 公钥加密管理员密码。 */
export function encryptPassword(publicKey: string, password: string): string {
  return publicEncrypt(
    {
      key: publicKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    Buffer.from(password, 'utf8')
  ).toString('base64');
}
