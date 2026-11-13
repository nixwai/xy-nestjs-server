import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { AdminService } from '../admin/admin.service.js';
import { AdminListQueryDto } from '../admin/dto/index.js';
import type { AdminPublicRecord } from '../admin/types/admin.types.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { PermissionCode } from '../authorization/constants/index.js';
import { ASSET_FOLDER_REPOSITORY } from './repositories/index.js';
import type { AssetFolderRepository } from './repositories/index.js';
import type {
  AssetFolderCreateRequest,
  AssetFolderItem,
  AssetFolderOwnerRecord,
  AssetFolderQueryScope,
  AssetFolderRecord,
  AssetFolderTreeNode,
  AssetFolderTreeResult,
  AssetFolderUpdateInput
} from './types/index.js';

/** 读取全部管理员账号时的分页大小，与账号列表接口的上限一致。 */
const ACCOUNT_PAGE_SIZE = 100;

/** 素材文件夹业务服务，统一处理层级、归属和数据范围。 */
@Injectable()
export class AssetFolderService {
  /** 创建当前实例。 */
  constructor(
    @Inject(ASSET_FOLDER_REPOSITORY) private readonly folders: AssetFolderRepository,
    @Inject(AuthorizationService) private readonly authorization: AuthorizationService,
    @Inject(AdminService) private readonly admins: AdminService
  ) {}

  /**
   * 组装以账号为根的素材文件夹树。
   *
   * @param actorId - 当前操作者管理员 ID。
   * @param all - 为真时按全部拥有者取数。
   * @throws ForbiddenException 请求全部数据范围但缺少全局素材管理权限。
   */
  async getTree(actorId: string, all = false): Promise<AssetFolderTreeResult> {
    if (all) await this.assertGlobalManagePermission(actorId);

    const scope: AssetFolderQueryScope = all ? { kind: 'all' } : { kind: 'owner', ownerId: actorId };
    const [items, roots] = await Promise.all([this.folders.list(scope), this.listTreeRoots(actorId, all)]);
    const accounts = await this.resolveAccounts(items, roots);
    const foldersByOwner = new Map<string, AssetFolderRecord[]>();
    for (const item of items) {
      foldersByOwner.set(item.ownerId, [...(foldersByOwner.get(item.ownerId) ?? []), item]);
    }

    return {
      owners: roots.map(owner => ({
        owner,
        children: this.buildNodes(owner, foldersByOwner.get(owner.id) ?? [], accounts)
      }))
    };
  }

  /**
   * 创建文件夹，父级存在时以父级拥有者作为最终归属。
   *
   * @param actorId - 当前操作者管理员 ID。
   * @param input - 文件夹名称与可选的父级、拥有者。
   * @throws ForbiddenException 指定拥有者与父级拥有者不一致，或跨拥有者创建缺少全局权限。
   * @throws NotFoundException 父级或目标拥有者不存在。
   * @throws ConflictException 同级已存在同名文件夹。
   */
  async create(actorId: string, input: AssetFolderCreateRequest): Promise<AssetFolderItem> {
    const parentId = input.parentId ?? null;
    const parent = parentId ? await this.requireFolder(parentId) : null;
    const ownerId = parent?.ownerId ?? input.ownerId ?? actorId;
    if (parent && input.ownerId && input.ownerId !== parent.ownerId) {
      throw new ForbiddenException('父子文件夹必须属于同一拥有者');
    }

    await this.assertCrossOwnerPermission(actorId, ownerId);
    await this.requireAccount(ownerId);
    const name = this.normalizeName(input.name);
    await this.assertNameAvailable(ownerId, parentId, name);

    return this.toItem(await this.folders.create({ name, parentId, ownerId, creatorId: actorId }));
  }

  /**
   * 重命名文件夹。
   *
   * @param actorId - 当前操作者管理员 ID。
   * @param id - 目标文件夹 ID。
   * @param input - 新的文件夹名称。
   * @throws NotFoundException 文件夹不存在。
   * @throws ConflictException 同级已存在同名文件夹。
   */
  async update(actorId: string, id: string, input: AssetFolderUpdateInput): Promise<AssetFolderItem> {
    const current = await this.requireFolder(id);
    await this.assertCrossOwnerPermission(actorId, current.ownerId);
    const name = this.normalizeName(input.name);
    await this.assertNameAvailable(current.ownerId, current.parentId, name, id);

    return this.toItem(await this.folders.update(id, { name }));
  }

  /**
   * 软删除文件夹，仅允许删除空文件夹。
   *
   * @param actorId - 当前操作者管理员 ID。
   * @param id - 目标文件夹 ID。
   * @throws NotFoundException 文件夹不存在。
   * @throws ConflictException 文件夹仍有子文件夹。
   */
  async softDelete(actorId: string, id: string): Promise<null> {
    const current = await this.requireFolder(id);
    await this.assertCrossOwnerPermission(actorId, current.ownerId);
    const children = await this.folders.listChildren(id);
    if (children.length > 0) throw new ConflictException('文件夹包含子文件夹，请先删除子文件夹');

    await this.folders.softDelete(id);
    return null;
  }

  /** 树根账号：全部范围取所有在册账号，否则只取操作者本人。 */
  private async listTreeRoots(actorId: string, all: boolean): Promise<AssetFolderOwnerRecord[]> {
    if (!all) return [await this.requireAccount(actorId)];
    return (await this.listAllAccounts()).map(account => this.toAccountRecord(account));
  }

  /** 逐页读取全部管理员账号，保证没有文件夹的账号也作为树根展示。 */
  private async listAllAccounts(): Promise<AdminPublicRecord[]> {
    const accounts: AdminPublicRecord[] = [];
    let page = 1;
    while (true) {
      const query = Object.assign(new AdminListQueryDto(), { page, pageSize: ACCOUNT_PAGE_SIZE });
      const result = await this.admins.listAdmins(query);
      accounts.push(...result.items);
      if (!result.hasNextPage) return accounts;
      page += 1;
    }
  }

  /** 汇总记录涉及的拥有者与创建者账号，查不到的账号以 ID 兜底展示。 */
  private async resolveAccounts(
    items: AssetFolderRecord[],
    roots: AssetFolderOwnerRecord[]
  ): Promise<Map<string, AssetFolderOwnerRecord>> {
    const accounts = new Map(roots.map(root => [root.id, root]));
    const unknownIds = [...new Set(items.flatMap(item => [item.ownerId, item.creatorId]))].filter(
      id => !accounts.has(id)
    );
    const resolved = await Promise.all(unknownIds.map(id => this.admins.findById(id)));
    unknownIds.forEach((id, index) => {
      const account = resolved[index];
      accounts.set(id, account ? this.toAccountRecord(account) : { id, username: id });
    });

    return accounts;
  }

  /** 按父子关系组装单个账号名下的文件夹节点。 */
  private buildNodes(
    owner: AssetFolderOwnerRecord,
    items: AssetFolderRecord[],
    accounts: Map<string, AssetFolderOwnerRecord>
  ): AssetFolderTreeNode[] {
    const byParent = new Map<string | null, AssetFolderRecord[]>();
    for (const item of items) {
      byParent.set(item.parentId, [...(byParent.get(item.parentId) ?? []), item]);
    }

    const build = (parentId: string | null): AssetFolderTreeNode[] =>
      (byParent.get(parentId) ?? []).map(item => ({
        ...item,
        owner,
        creator: accounts.get(item.creatorId) ?? { id: item.creatorId, username: item.creatorId },
        children: build(item.id)
      }));

    return build(null);
  }

  /** 补齐单条记录的拥有者与创建者登录名。 */
  private async toItem(record: AssetFolderRecord): Promise<AssetFolderItem> {
    const accounts = await this.resolveAccounts([record], []);

    return {
      ...record,
      ownerUsername: accounts.get(record.ownerId)?.username ?? record.ownerId,
      creatorUsername: accounts.get(record.creatorId)?.username ?? record.creatorId
    };
  }

  /** 去掉首尾空白并校验文件夹名称长度。 */
  private normalizeName(value: string): string {
    const name = value.trim();
    if (!name || name.length > 128) throw new BadRequestException('文件夹名称长度必须为 1 到 128 个字符');
    return name;
  }

  /** 读取有效文件夹，不存在时按资源缺失处理。 */
  private async requireFolder(id: string): Promise<AssetFolderRecord> {
    const folder = await this.folders.findById(id);
    if (!folder) throw new NotFoundException('文件夹不存在');
    return folder;
  }

  /** 读取管理员账号并转换为归属账号信息，不存在时按资源缺失处理。 */
  private async requireAccount(adminId: string): Promise<AssetFolderOwnerRecord> {
    const account = await this.admins.findById(adminId);
    if (!account) throw new NotFoundException('素材归属账号不存在');
    return this.toAccountRecord(account);
  }

  /** 提取账号中参与素材归属展示的字段。 */
  private toAccountRecord(account: AssetFolderOwnerRecord): AssetFolderOwnerRecord {
    return { id: account.id, username: account.username };
  }

  /** 同一拥有者、同一父级下的名称必须唯一。 */
  private async assertNameAvailable(
    ownerId: string,
    parentId: string | null,
    name: string,
    excludeId?: string
  ): Promise<void> {
    if (await this.folders.findByName(ownerId, parentId, name, excludeId)) {
      throw new ConflictException('同级文件夹名称已存在');
    }
  }

  /** 操作他人文件夹需要全局素材管理权限。 */
  private async assertCrossOwnerPermission(actorId: string, ownerId: string): Promise<void> {
    if (ownerId !== actorId) await this.assertGlobalManagePermission(actorId);
  }

  /** 校验全局素材管理权限。 */
  private async assertGlobalManagePermission(actorId: string): Promise<void> {
    if (!(await this.authorization.hasPermission(actorId, PermissionCode.ASSET_FOLDER_ALL))) {
      throw new ForbiddenException('无权执行该素材文件夹操作');
    }
  }
}
