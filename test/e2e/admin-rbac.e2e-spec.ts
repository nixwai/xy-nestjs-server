import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestModule } from './create-test-module.js';
import { ADMIN_REPOSITORY } from '#/modules/admin/repositories/admin-repository.port.js';
import type { AdminRepository } from '#/modules/admin/repositories/admin-repository.port.js';
import { hashPassword } from '#/modules/auth/utils/password.util.js';
import { createStrictValidationPipe } from '#/common/pipes/index.js';
import { encryptPassword } from './password-transport.js';

describe('RBAC management API (e2e)', () => {
  let app: INestApplication;
  let repository: AdminRepository;
  let publicKey: string;
  beforeEach(async () => {
    const moduleRef = await createTestModule().compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(createStrictValidationPipe());
    await app.init();
    repository = app.get<AdminRepository>(ADMIN_REPOSITORY);
    const keyResponse = await request(app.getHttpServer()).get('/api/auth/admin/public-key').expect(200);
    publicKey = keyResponse.body.data.publicKey as string;
    const root = await hashPassword('Root1234');
    await repository.create({
      username: 'root',
      passwordHash: root.hash,
      passwordSalt: root.salt,
      isRoot: true
    });
    const operator = await hashPassword('Operator1234');
    await repository.create({
      username: 'operator',
      passwordHash: operator.hash,
      passwordSalt: operator.salt
    });
  });
  afterEach(async () => {
    await app.close();
  });
  async function login(username: string, password: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .send({ username, password: encryptPassword(publicKey, password) })
      .expect(200);
    return response.body.data.accessToken as string;
  }
  it('allows root administrators to access RBAC management and protects account changes with password verification', async () => {
    const token = await login('root', 'Root1234');
    const firstAdminPage = await request(app.getHttpServer())
      .get('/api/admin/list?page=1&pageSize=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(firstAdminPage.body.data.items).toHaveLength(1);
    expect(firstAdminPage.body.data.total).toBe(2);
    expect(firstAdminPage.body.data.page).toBe(1);
    expect(firstAdminPage.body.data.pageSize).toBe(1);
    expect(firstAdminPage.body.data.hasNextPage).toBe(true);

    const secondAdminPage = await request(app.getHttpServer())
      .get('/api/admin/list?page=2&pageSize=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(secondAdminPage.body.data.items).toHaveLength(1);
    expect(secondAdminPage.body.data.hasPreviousPage).toBe(true);
    const denied = await request(app.getHttpServer())
      .post('/api/admin/update')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: '1', username: 'root-renamed' })
      .expect(200);
    expect(denied.body.code).toBe(40300);
    const allowed = await request(app.getHttpServer())
      .post('/api/admin/update')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: '1', username: 'root-renamed', currentPassword: encryptPassword(publicKey, 'Root1234') })
      .expect(200);
    expect(allowed.body.code).toBe(0);
  });
  it('supports role page pagination and audit cursor pagination', async () => {
    const token = await login('root', 'Root1234');
    await request(app.getHttpServer())
      .post('/api/role/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'operator', name: '运营人员' })
      .expect(200);

    const roles = await request(app.getHttpServer())
      .get('/api/role/list?page=1&pageSize=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(roles.body.data.items).toHaveLength(1);
    expect(roles.body.data.total).toBe(1);
    expect(roles.body.data.totalPages).toBe(1);

    const firstAuditPage = await request(app.getHttpServer())
      .get('/api/audit/list?limit=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(firstAuditPage.body.data.items).toHaveLength(1);
    expect(firstAuditPage.body.data).not.toHaveProperty('total');
    if (firstAuditPage.body.data.hasMore) {
      const secondAuditPage = await request(app.getHttpServer())
        .get(`/api/audit/list?limit=1&cursor=${encodeURIComponent(firstAuditPage.body.data.nextCursor)}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(secondAuditPage.body.data.items).toHaveLength(1);
    }
  });

  it('supports menu management and returns menus from persistence', async () => {
    const token = await login('root', 'Root1234');
    const created = await request(app.getHttpServer())
      .post('/api/menu/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '测试菜单',
        path: '/test-menu',
        icon: 'carbon:test',
        order: 99,
        permissionCode: null
      })
      .expect(200);
    expect(created.body.code).toBe(0);
    const menuId = created.body.data.id as string;
    const listed = await request(app.getHttpServer())
      .get('/api/menu/list')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(listed.body.data.items.some((item: { id: string }) => item.id === menuId)).toBe(true);
    await request(app.getHttpServer())
      .post('/api/menu/soft-delete')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: menuId })
      .expect(200);
  });
  it('returns root administrator menus and supports password reset', async () => {
    const token = await login('root', 'Root1234');
    const own = await request(app.getHttpServer())
      .get('/api/admin/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(own.body.data.menus.map((item: { path: string }) => item.path)).toEqual(['/home']);
    const reset = await request(app.getHttpServer())
      .post('/api/admin/reset-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: '2',
        password: encryptPassword(publicKey, 'NewOperator1234'),
        currentPassword: encryptPassword(publicKey, 'Root1234')
      })
      .expect(200);
    expect(reset.body.code).toBe(0);
    const relogin = await login('operator', 'NewOperator1234');
    expect(relogin).toBeTruthy();
  });
  it('allows ordinary administrators to read their own authorization only', async () => {
    const token = await login('operator', 'Operator1234');
    const own = await request(app.getHttpServer())
      .get('/api/admin/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(own.body.data.username).toBe('operator');
    expect(own.body.data.permissions).toEqual([]);
    expect(own.body.data.menus.map((item: { path: string }) => item.path)).toEqual(['/home']);
    const denied = await request(app.getHttpServer())
      .get('/api/admin/list')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(denied.body.code).toBe(40300);
  });
});
