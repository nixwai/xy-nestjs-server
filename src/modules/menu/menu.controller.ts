import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponses, ApiOkResponseData } from '#/common/decorators/index.js';
import { omitUndefined } from '#/common/utils/index.js';
import { CurrentAdmin } from '../auth/decorators/index.js';
import type { AdminJwtPayload } from '../auth/types/jwt.types.js';
import { RootOnly } from '../authorization/decorators/index.js';
import { MenuListResponseDto, MenuResponseDto, MenuStatusRequestDto, MenuUpdateRequestDto } from './dto/index.js';
import { MenuService } from './menu.service.js';
/** 定义 MenuController。 */
@ApiTags('菜单管理')
@ApiCommonResponses()
@Controller('menu')
@RootOnly()
export class MenuController {
  /** 创建当前实例。 */
  constructor(@Inject(MenuService) private readonly service: MenuService) {}

  /** 查询记录列表 */
  @Get('list')
  @ApiOperation({ summary: '查询菜单列表', description: '返回全部菜单及权限可用状态。' })
  @ApiOkResponseData(MenuListResponseDto)
  async list() {
    const items = await this.service.list();
    return { items, total: items.length };
  }

  /** 更新记录 */
  @Post('update')
  @ApiOperation({ summary: '更新菜单展示配置' })
  @ApiBody({ type: MenuUpdateRequestDto })
  @ApiOkResponseData(MenuResponseDto)
  async update(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: MenuUpdateRequestDto) {
    return this.service.update(
      admin.sub,
      body.id,
      omitUndefined({ title: body.title, order: body.order, isActive: body.isActive })
    );
  }

  /** enable。 */
  @Post('enable')
  @ApiOperation({ summary: '启用菜单' })
  @ApiBody({ type: MenuStatusRequestDto })
  @ApiOkResponseData(MenuResponseDto)
  async enable(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: MenuStatusRequestDto) {
    return this.service.setActive(admin.sub, body.id, true);
  }

  /** disable。 */
  @Post('disable')
  @ApiOperation({ summary: '停用菜单' })
  @ApiBody({ type: MenuStatusRequestDto })
  @ApiOkResponseData(MenuResponseDto)
  async disable(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: MenuStatusRequestDto) {
    return this.service.setActive(admin.sub, body.id, false);
  }
}
