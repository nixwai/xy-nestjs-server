import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestModule } from './create-test-module.js';
import { ADMIN_REPOSITORY } from '../../src/modules/admin/repositories/admin-repository.port.js';
import type { AdminRepository } from '../../src/modules/admin/repositories/admin-repository.port.js';
import { hashPassword } from '../../src/modules/auth/utils/password.util.js';

const versionHeader = 'application/vnd.scenic.v1+json';

describe('RBAC management API (e2e)', () => {
  let app: INestApplication;
  let repository: AdminRepository;
  beforeEach(async () => {
    const moduleRef = await createTestModule().compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    repository = app.get<AdminRepository>(ADMIN_REPOSITORY);
    const root = await hashPassword('Root1234');
    await repository.create({
      username: 'root',
      passwordHash: root.hash,
      passwordSalt: root.salt,
      isSuperAdmin: true,
    });
    const operator = await hashPassword('Operator1234');
    await repository.create({
      username: 'operator',
      passwordHash: operator.hash,
      passwordSalt: operator.salt,
    });
  });
  afterEach(async () => {
    await app.close();
  });
  async function login(username: string, password: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .set('Accept', versionHeader)
      .send({ username, password })
      .expect(200);
    return response.body.data.accessToken as string;
  }
  it('allows super administrators to access RBAC management and protects account changes with password verification', async () => {
    const token = await login('root', 'Root1234');
    await request(app.getHttpServer())
      .get('/api/admin/list')
      .set('Accept', versionHeader)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const denied = await request(app.getHttpServer())
      .post('/api/admin/update')
      .set('Accept', versionHeader)
      .set('Authorization', `Bearer ${token}`)
      .send({ id: '1', username: 'root-renamed' })
      .expect(200);
    expect(denied.body.code).toBe(40300);
    const allowed = await request(app.getHttpServer())
      .post('/api/admin/update')
      .set('Accept', versionHeader)
      .set('Authorization', `Bearer ${token}`)
      .send({ id: '1', username: 'root-renamed', currentPassword: 'Root1234' })
      .expect(200);
    expect(allowed.body.code).toBe(0);
  });
  it('supports menu management and returns menus from persistence', async () => {
    const token = await login('root', 'Root1234');
    const created = await request(app.getHttpServer())
      .post('/api/menu/create')
      .set('Accept', versionHeader)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '测试菜单', path: '/test-menu', icon: 'carbon:test', order: 99, permissionCode: null })
      .expect(200);
    expect(created.body.code).toBe(0);
    const menuId = created.body.data.id as string;
    const listed = await request(app.getHttpServer())
      .get('/api/menu/list')
      .set('Accept', versionHeader)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(listed.body.data.items.some((item: { id: string }) => item.id === menuId)).toBe(true);
    await request(app.getHttpServer())
      .post('/api/menu/soft-delete')
      .set('Accept', versionHeader)
      .set('Authorization', `Bearer ${token}`)
      .send({ id: menuId })
      .expect(200);
  });
  it('returns super administrator menus and supports password reset', async () => {
    const token = await login('root', 'Root1234');
    const own = await request(app.getHttpServer())
      .get('/api/admin/me')
      .set('Accept', versionHeader)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(own.body.data.menus.map((item: { path: string }) => item.path)).toEqual(['/home', '/admin', '/permission', '/menu']);
    const reset = await request(app.getHttpServer())
      .post('/api/admin/reset-password')
      .set('Accept', versionHeader)
      .set('Authorization', `Bearer ${token}`)
      .send({ id: '2', password: 'NewOperator1234', currentPassword: 'Root1234' })
      .expect(200);
    expect(reset.body.code).toBe(0);
    const relogin = await login('operator', 'NewOperator1234');
    expect(relogin).toBeTruthy();
  });
  it('allows ordinary administrators to read their own authorization only', async () => {
    const token = await login('operator', 'Operator1234');
    const own = await request(app.getHttpServer())
      .get('/api/admin/me')
      .set('Accept', versionHeader)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(own.body.data.username).toBe('operator');
    expect(own.body.data.permissions).toEqual([]);
    expect(own.body.data.menus.map((item: { path: string }) => item.path)).toEqual(['/home']);
    const denied = await request(app.getHttpServer())
      .get('/api/admin/list')
      .set('Accept', versionHeader)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(denied.body.code).toBe(40300);
  });
});
