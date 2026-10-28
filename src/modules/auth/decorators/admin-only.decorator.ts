import { SetMetadata } from '@nestjs/common';

/** 标记只允许管理员角色访问的路由。 */
export const ADMIN_ROLE_KEY = 'adminRole';
export const AdminOnly = () => SetMetadata(ADMIN_ROLE_KEY, true);
