import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { constants, createPrivateKey, createPublicKey, privateDecrypt } from 'node:crypto';
import type { KeyObject } from 'node:crypto';

const RSA_MODULUS_LENGTH = 2048;
const RSA_CIPHERTEXT_BYTES = RSA_MODULUS_LENGTH / 8;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;
const BASE64_CIPHERTEXT_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

/** 提供管理员密码传输层的 RSA-OAEP-SHA256 解密能力。 */
@Injectable()
export class PasswordTransportService {
  private readonly privateKey: KeyObject;
  private readonly publicKeyPem: string;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    const encodedPrivateKey = this.configService.getOrThrow<string>('auth.rsaPrivateKey');
    const privateKey = parsePrivateKey(encodedPrivateKey);
    const publicKey = createPublicKey(privateKey);
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });

    if (typeof publicKeyPem !== 'string') {
      throw new Error('AUTH_RSA_PRIVATE_KEY 配置无法导出公钥');
    }

    this.privateKey = privateKey;
    this.publicKeyPem = publicKeyPem;
  }

  /** 返回由配置私钥派生的 PKIX PEM 公钥。 */
  getPublicKey(): string {
    return this.publicKeyPem;
  }

  /** 解密并校验一个管理员密码字段。 */
  decryptPassword(ciphertext: string, label = '密码'): string {
    const plaintext = this.decryptTransport(ciphertext);
    validatePassword(plaintext, label);
    return plaintext;
  }

  /** 解密并校验可选的管理员密码字段。 */
  decryptOptionalPassword(ciphertext: string | undefined, label = '密码'): string | undefined {
    if (ciphertext === undefined) {
      return undefined;
    }

    return this.decryptPassword(ciphertext, label);
  }

  private decryptTransport(ciphertext: string): string {
    try {
      if (!BASE64_CIPHERTEXT_PATTERN.test(ciphertext)) {
        throw new Error('invalid base64 ciphertext');
      }

      const encrypted = Buffer.from(ciphertext, 'base64');
      if (encrypted.length !== RSA_CIPHERTEXT_BYTES) {
        throw new Error('invalid RSA ciphertext length');
      }

      const plaintext = privateDecrypt(
        {
          key: this.privateKey,
          padding: constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        encrypted
      );
      const decoded = plaintext.toString('utf8');
      if (decoded.length === 0) {
        throw new Error('empty plaintext');
      }

      return decoded;
    } catch {
      throw new BadRequestException('密码解密失败');
    }
  }
}

/** 校验解密后的管理员密码规则。 */
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

function parsePrivateKey(encodedPrivateKey: string): KeyObject {
  try {
    if (!BASE64_CIPHERTEXT_PATTERN.test(encodedPrivateKey)) {
      throw new Error('invalid base64 private key');
    }

    const der = Buffer.from(encodedPrivateKey, 'base64');
    const privateKey = createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
    const details = privateKey.asymmetricKeyDetails;
    if (
      privateKey.asymmetricKeyType !== 'rsa' ||
      !details?.modulusLength ||
      details.modulusLength !== RSA_MODULUS_LENGTH
    ) {
      throw new Error('RSA private key must be exactly 2048 bits');
    }

    return privateKey;
  } catch {
    throw new Error('AUTH_RSA_PRIVATE_KEY 配置无效，必须是 Base64 编码的 PKCS#8 RSA 私钥');
  }
}
