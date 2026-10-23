import { SetMetadata } from '@nestjs/common';

/** 标记不需要 API 版本头校验的路由。 */
export const SkipApiVersion = () => SetMetadata('skipApiVersion', true);
