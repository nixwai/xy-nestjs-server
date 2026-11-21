import { SetMetadata } from '@nestjs/common';

/** 用户身份元数据键。 */
export const USER_ROLE_KEY = 'userRole';

/** 标记只允许微信用户身份访问的路由。 */
export const UserOnly = () => SetMetadata(USER_ROLE_KEY, true);
