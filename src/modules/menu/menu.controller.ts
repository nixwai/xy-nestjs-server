import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiCommonResponses,
  ApiOkResponseData,
  ApiOkResponseEmpty,
} from '../../common/decorators/index.js';
import { CurrentAdmin } from '../auth/decorators/index.js';
import type { AdminJwtPayload } from '../auth/tokens/jwt-token.service.js';
import {
  RequirePermission,
  SuperAdminOnly,
} from '../authorization/decorators/index.js';
import { PermissionResource } from '../authorization/enums/index.js';
import {
  MenuCreateRequestDto,
  MenuListResponseDto,
  MenuResponseDto,
  MenuStatusRequestDto,
  MenuUpdateRequestDto,
} from './dto/index.js';
import { MenuService } from './menu.service.js';
@ApiTags('菜单管理')
@ApiCommonResponses()
@Controller('menu')
@SuperAdminOnly()
export class MenuController {
  constructor(private readonly service: MenuService) {}
  @Get('list')
  @ApiOperation({
    summary: '查询完整菜单列表',
    description: '返回用于菜单树和授权计算的全部未软删除菜单，不执行分页。',
  })
  @ApiOkResponseData(MenuListResponseDto)
  @RequirePermission(PermissionResource.MENU)
  async list() {
    const items = await this.service.list();
    return { items, total: items.length };
  }
  @Post('create')
  @ApiOperation({ summary: '创建菜单' })
  @ApiBody({ type: MenuCreateRequestDto })
  @ApiOkResponseData(MenuResponseDto)
  @RequirePermission(PermissionResource.MENU)
  async create(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: MenuCreateRequestDto,
  ) {
    return this.service.create(admin.sub, {
      parentId: body.parentId ?? null,
      title: body.title,
      path: body.path,
      icon: body.icon ?? null,
      order: body.order ?? 0,
      permissionCode: body.permissionCode ?? null,
      isActive: true,
    });
  }

  @Post('update')
  @ApiOperation({ summary: '更新菜单' })
  @ApiBody({ type: MenuUpdateRequestDto })
  @ApiOkResponseData(MenuResponseDto)
  @RequirePermission(PermissionResource.MENU)
  async update(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: MenuUpdateRequestDto,
  ) {
    return this.service.update(admin.sub, body.id, {
      parentId: body.parentId ?? null,
      title: body.title,
      path: body.path,
      icon: body.icon ?? null,
      order: body.order ?? 0,
      permissionCode: body.permissionCode ?? null,
      isActive: body.isActive ?? true,
    });
  }

  @Post('soft-delete')
  @ApiOperation({ summary: '删除菜单' })
  @ApiBody({ type: MenuStatusRequestDto })
  @ApiOkResponseEmpty()
  @RequirePermission(PermissionResource.MENU)
  async remove(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: MenuStatusRequestDto,
  ) {
    await this.service.softDelete(admin.sub, body.id);
    return null;
  }
  @Post('enable')
  @ApiOperation({ summary: '启用菜单' })
  @ApiBody({ type: MenuStatusRequestDto })
  @ApiOkResponseData(MenuResponseDto)
  @RequirePermission(PermissionResource.MENU)
  async enable(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: MenuStatusRequestDto,
  ) {
    return this.service.setActive(admin.sub, body.id, true);
  }

  @Post('disable')
  @ApiOperation({ summary: '停用菜单' })
  @ApiBody({ type: MenuStatusRequestDto })
  @ApiOkResponseData(MenuResponseDto)
  @RequirePermission(PermissionResource.MENU)
  async disable(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: MenuStatusRequestDto,
  ) {
    return this.service.setActive(admin.sub, body.id, false);
  }
}
