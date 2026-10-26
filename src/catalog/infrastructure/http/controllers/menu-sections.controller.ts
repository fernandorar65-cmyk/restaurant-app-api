import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MenuSectionsService } from '../../../application/menu-sections/menu-sections.service.js';
import {
  CreateMenuSectionDto,
  MenuSectionResponseDto,
  UpdateMenuSectionDto,
} from '../dto/categories/category.dto.js';

/** Visible sections of a menu; its products are placed in them via menuSectionId. */
@ApiTags('catalog/menus')
@Controller('menus/:menuId/sections')
export class MenuSectionsController {
  constructor(private readonly sectionsService: MenuSectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una sección del menú' })
  @ApiCreatedResponse({ type: MenuSectionResponseDto })
  async create(
    @Param('menuId', ParseUUIDPipe) menuId: string,
    @Body() dto: CreateMenuSectionDto,
  ): Promise<MenuSectionResponseDto> {
    return MenuSectionResponseDto.fromDomain(await this.sectionsService.create(menuId, dto));
  }

  @Get()
  @ApiOperation({ summary: 'Secciones del menú, en orden' })
  @ApiOkResponse({ type: [MenuSectionResponseDto] })
  async list(
    @Param('menuId', ParseUUIDPipe) menuId: string,
  ): Promise<MenuSectionResponseDto[]> {
    const sections = await this.sectionsService.list(menuId);
    return sections.map((section) => MenuSectionResponseDto.fromDomain(section));
  }

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

  @Delete(':sectionId')
  @ApiOperation({
    summary: 'Desactivar una sección (baja lógica)',
    description: 'Los productos siguen en el menú',
  })
  @ApiOkResponse({ description: 'Id de la sección desactivada' })
  async deactivate(
    @Param('menuId', ParseUUIDPipe) menuId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
  ): Promise<{ id: string }> {
    await this.sectionsService.deactivate(menuId, sectionId);
    return { id: sectionId };
  }
}
