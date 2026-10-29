import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import dataSource from '../src/data-source.js';
import { AdminEntity } from '../src/modules/admin/entities/admin.entity.js';
import { AdminRoleEntity } from '../src/modules/admin/entities/admin-role.entity.js';
import { PermissionEntity } from '../src/modules/permission/entities/permission.entity.js';
import { RoleEntity } from '../src/modules/role/entities/role.entity.js';
import { RolePermissionEntity } from '../src/modules/role/entities/role-permission.entity.js';
import { hashPassword } from '../src/modules/auth/utils/password.util.js';
import { REGISTERED_PERMISSIONS } from '../src/modules/permission/permission-registry.js';
import { createPermissionCode } from '../src/common/utils/permission-code.util.js';
import { HttpMethod, PermissionResource } from '../src/common/enums/index.js';

const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,64}$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

/** 幂等初始化超级管理员、默认角色和权限目录。 */
async function main(): Promise<void> {
  const readline = createInterface({ input, output });
  try {
    const username = await readline.question('管理员用户名: ');
    if (!USERNAME_PATTERN.test(username)) {
      throw new Error('用户名格式无效');
    }
    const password = await readHidden('管理员密码: ');
    if (!PASSWORD_PATTERN.test(password)) {
      throw new Error('密码必须为 8-72 位且同时包含字母和数字');
    }
    const confirmation = await readHidden('确认密码: ');
    if (password !== confirmation) {
      throw new Error('两次输入的密码不一致');
    }
    await dataSource.initialize();
    await dataSource.transaction(async (manager) => {
      const permissions = await Promise.all(
        REGISTERED_PERMISSIONS.map(async (input) => {
          const repository = manager.getRepository(PermissionEntity);
          const existing = await repository.findOne({
            where: { code: input.code },
          });
          return repository.save(
            existing
              ? repository.merge(existing, input)
              : repository.create(input),
          );
        }),
      );
      const roleRepository = manager.getRepository(RoleEntity);
      let role = await roleRepository.findOne({
        where: { code: 'operator' },
      });
      if (!role) {
        role = await roleRepository.save(
          roleRepository.create({
            code: 'operator',
            name: '普通管理员',
            description: '默认普通管理员角色',
            isActive: true,
          }),
        );
      }
      const selfPermission = permissions.find(
        (item) =>
          item.code ===
          createPermissionCode(PermissionResource.ADMIN_SELF, HttpMethod.GET),
      );
      if (selfPermission) {
        const relationRepository = manager.getRepository(RolePermissionEntity);
        const exists = await relationRepository.findOne({
          where: { roleId: role.id, permissionId: selfPermission.id },
        });
        if (!exists) {
          await relationRepository.save(
            relationRepository.create({
              roleId: role.id,
              permissionId: selfPermission.id,
            }),
          );
        }
      }
      const adminRepository = manager.getRepository(AdminEntity);
      const existingAdmins = await adminRepository.find({
        where: { isSuperAdmin: false },
      });
      const adminRoleRepository = manager.getRepository(AdminRoleEntity);
      for (const admin of existingAdmins) {
        const relation = await adminRoleRepository.findOne({
          where: { adminId: admin.id, roleId: role.id },
        });
        if (!relation) {
          await adminRoleRepository.save(
            adminRoleRepository.create({ adminId: admin.id, roleId: role.id }),
          );
        }
      }
      const existing = await adminRepository.findOne({
        where: { username },
      });
      const { hash, salt } = await hashPassword(password);
      if (existing) {
        existing.passwordHash = hash;
        existing.passwordSalt = salt;
        existing.isActive = true;
        existing.isSuperAdmin = true;
        await adminRepository.save(existing);
        console.log(`超级管理员 ${username} 已更新`);
      } else {
        await adminRepository.save(
          adminRepository.create({
            username,
            passwordHash: hash,
            passwordSalt: salt,
            isActive: true,
            isSuperAdmin: true,
          }),
        );
        console.log(`超级管理员 ${username} 创建成功`);
      }
    });
  } finally {
    readline.close();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

/** 在终端中读取不回显的密码。 */
async function readHidden(prompt: string): Promise<string> {
  if (!input.isTTY || !output.isTTY) {
    const readline = createInterface({ input, output });
    try {
      return await readline.question(prompt);
    } finally {
      readline.close();
    }
  }
  output.write(prompt);
  input.setRawMode(true);
  return new Promise((resolve, reject) => {
    let value = '';
    const onData = (chunk: Buffer) => {
      const character = chunk.toString('utf8');
      if (character === '\r' || character === '\n') {
        input.setRawMode(false);
        input.off('data', onData);
        output.write('\n');
        resolve(value);
      } else if (character === '\u0003') {
        input.setRawMode(false);
        input.off('data', onData);
        reject(new Error('操作已取消'));
      } else if (character === '\u007f') {
        value = value.slice(0, -1);
      } else {
        value += character;
      }
    };
    input.on('data', onData);
  });
}

await main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : '管理员初始化失败';
  console.error(message);
  process.exitCode = 1;
});
