import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponses, ApiOkResponseData } from '#/common/decorators/index.js';
import { CurrentAdmin } from '../auth/decorators/index.js';
import type { AdminJwtPayload } from '../auth/tokens/jwt-token.service.js';
import { RootOnly } from '../authorization/decorators/index.js';
import { MenuListResponseDto, MenuResponseDto, MenuStatusRequestDto, MenuUpdateRequestDto } from './dto/index.js';
import { MenuService } from './menu.service.js';

@ApiTags('菜单管理')
@ApiCommonResponses()
@Controller('menu')
@RootOnly()
export class MenuController {
  constructor(@Inject(MenuService) private readonly service: MenuService) {}

  @Get('list')
  @ApiOperation({ summary: '查询菜单列表', description: '返回全部菜单及权限可用状态。' })
  @ApiOkResponseData(MenuListResponseDto)
  async list() {
    const items = await this.service.list();
    return { items, total: items.length };
  }

  @Post('update')
  @ApiOperation({ summary: '更新菜单展示配置' })
  @ApiBody({ type: MenuUpdateRequestDto })
  @ApiOkResponseData(MenuResponseDto)
  async update(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: MenuUpdateRequestDto) {
    return this.service.update(admin.sub, body.id, {
      ...(body.title === undefined ? {} : { title: body.title }),
      ...(body.order === undefined ? {} : { order: body.order }),
      ...(body.isActive === undefined ? {} : { isActive: body.isActive })
    });
  }

  @Post('enable')
  @ApiOperation({ summary: '启用菜单' })
  @ApiBody({ type: MenuStatusRequestDto })
  @ApiOkResponseData(MenuResponseDto)
  async enable(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: MenuStatusRequestDto) {
    return this.service.setActive(admin.sub, body.id, true);
  }

  @Post('disable')
  @ApiOperation({ summary: '停用菜单' })
  @ApiBody({ type: MenuStatusRequestDto })
  @ApiOkResponseData(MenuResponseDto)
  async disable(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: MenuStatusRequestDto) {
    return this.service.setActive(admin.sub, body.id, false);
  }
}
