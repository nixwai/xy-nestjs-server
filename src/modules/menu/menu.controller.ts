import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
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
  @ApiOperation({ summary: '查询菜单列表' })
  @ApiOkResponseData(MenuResponseDto)
  @RequirePermission(PermissionResource.MENU)
  async list() {
    const items = await this.service.list();
    return { items, total: items.length };
  }
  @Post('create')
  @ApiOperation({ summary: '创建菜单' })
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
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
