import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MenusService } from '../../../application/menus/menus.service.js';
import { CreateMenuDto } from '../dto/menus/create-menu.dto.js';
import { MenuResponseDto } from '../dto/menus/menu-response.dto.js';
import { UpdateMenuDto } from '../dto/menus/update-menu.dto.js';

@ApiTags('organizations/menus')
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un menú' })
  @ApiCreatedResponse({ type: MenuResponseDto })
  async create(@Body() dto: CreateMenuDto): Promise<MenuResponseDto> {
    const menu = await this.menusService.create(dto);
    return MenuResponseDto.fromDomain(menu);
  }

  @Get()
  @ApiOperation({ summary: 'Listar menús' })
  @ApiOkResponse({ type: [MenuResponseDto] })
  async findAll(): Promise<MenuResponseDto[]> {
    const menus = await this.menusService.findAll();
    return menus.map(MenuResponseDto.fromDomain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un menú por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: MenuResponseDto })
  @ApiNotFoundResponse({ description: 'Menú no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MenuResponseDto> {
    const menu = await this.menusService.findOne(id);
    return MenuResponseDto.fromDomain(menu);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un menú' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: MenuResponseDto })
  @ApiNotFoundResponse({ description: 'Menú no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuDto,
  ): Promise<MenuResponseDto> {
    const menu = await this.menusService.update(id, dto);
    return MenuResponseDto.fromDomain(menu);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un menú' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Id del menú eliminado' })
  @ApiNotFoundResponse({ description: 'Menú no encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.menusService.remove(id);
    return { id };
  }
}
