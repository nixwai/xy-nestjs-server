import { ApiProperty } from '@nestjs/swagger';

/** 管理员密码传输加密公钥响应。 */
export class AdminPublicKeyResponseDto {
  @ApiProperty({
    type: String,
    description: '用于 RSA-OAEP-SHA256 加密管理员密码字段的 PKIX PEM 公钥。'
  })
  publicKey!: string;
}
