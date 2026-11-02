import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MenuSectionsService } from '../../../application/menu-sections/menu-sections.service.js';
import {
  CreateMenuSectionDto,
  MenuSectionResponseDto,
  UpdateMenuSectionDto,
} from '../dto/categories/category.dto.js';
import { ReorderMenuSectionsDto } from '../dto/menus/menu-product.dto.js';
import {
  Authorize,
  Scope,
} from '../../../../common/infrastructure/http/access/authorize.decorator.js';
import { IdResponseDto } from '../../../../common/infrastructure/http/id-response.dto.js';

/** Visible sections of a menu; its products are placed in them via menuSectionId. */
@ApiTags('catalog/menus')
@Controller('menus/:menuId/sections')
export class MenuSectionsController {
  constructor(private readonly sectionsService: MenuSectionsService) {}

  @Authorize('catalog.manage', Scope.resource('menu', 'menuId'))
  @Post()
  @ApiOperation({ summary: 'Crear una sección del menú' })
  @ApiCreatedResponse({ type: MenuSectionResponseDto })
  async create(
    @Param('menuId', ParseUUIDPipe) menuId: string,
    @Body() dto: CreateMenuSectionDto,
  ): Promise<MenuSectionResponseDto> {
    return MenuSectionResponseDto.fromDomain(
      await this.sectionsService.create(menuId, dto),
    );
  }

  @Authorize(null, Scope.resource('menu', 'menuId'))
  @Get()
  @ApiOperation({ summary: 'Secciones del menú, en orden' })
  @ApiOkResponse({ type: [MenuSectionResponseDto] })
  async list(
    @Param('menuId', ParseUUIDPipe) menuId: string,
  ): Promise<MenuSectionResponseDto[]> {
    const sections = await this.sectionsService.list(menuId);
    return sections.map((section) =>
      MenuSectionResponseDto.fromDomain(section),
    );
  }

  @Authorize('catalog.manage', Scope.resource('menu', 'menuId'))
  @Put('order')
  @ApiOperation({
    summary: 'Reordenar todas las secciones del menú en una sola petición',
    description:
      'ids debe traer todas las secciones del menú (incluidas las ocultas) una sola vez; si no, 400 y no cambia nada',
  })
  @ApiOkResponse({ type: [MenuSectionResponseDto] })
  async reorder(
    @Param('menuId', ParseUUIDPipe) menuId: string,
    @Body() dto: ReorderMenuSectionsDto,
  ): Promise<MenuSectionResponseDto[]> {
    const sections = await this.sectionsService.reorder(menuId, dto.ids);
    return sections.map((section) =>
      MenuSectionResponseDto.fromDomain(section),
    );
  }

  @Authorize('catalog.manage', Scope.resource('menu', 'menuId'))
  @Patch(':sectionId')
  @ApiOperation({ summary: 'Editar, ordenar u ocultar una sección' })
  @ApiOkResponse({ type: MenuSectionResponseDto })
  async update(
    @Param('menuId', ParseUUIDPipe) menuId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() dto: UpdateMenuSectionDto,
  ): Promise<MenuSectionResponseDto> {
    return MenuSectionResponseDto.fromDomain(
      await this.sectionsService.update(menuId, sectionId, dto),
    );
  }

  @Authorize('catalog.manage', Scope.resource('menu', 'menuId'))
  @Delete(':sectionId')
  @ApiOperation({
    summary: 'Desactivar una sección (baja lógica)',
    description: 'Los productos siguen en el menú',
  })
  @ApiOkResponse({
    type: IdResponseDto,
    description: 'Id de la sección desactivada',
  })
  async deactivate(
    @Param('menuId', ParseUUIDPipe) menuId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
  ): Promise<{ id: string }> {
    await this.sectionsService.deactivate(menuId, sectionId);
    return { id: sectionId };
  }
}
