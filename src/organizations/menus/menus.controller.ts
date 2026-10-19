import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { CreateMenuDto } from './dto/create-menu.dto.js';
import { UpdateMenuDto } from './dto/update-menu.dto.js';
import { Menu } from './entities/menu.entity.js';
import { MenusService } from './menus.service.js';

@ApiTags('organizations/menus')
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un menú' })
  @ApiCreatedResponse({ type: Menu })
  create(@Body() dto: CreateMenuDto): Promise<Menu> {
    return this.menusService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar menús' })
  @ApiOkResponse({ type: [Menu] })
  findAll(): Promise<Menu[]> {
    return this.menusService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un menú por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: Menu })
  @ApiNotFoundResponse({ description: 'Menú no encontrado' })
  findOne(@Param('id') id: string): Promise<Menu> {
    return this.menusService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un menú' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: Menu })
  @ApiNotFoundResponse({ description: 'Menú no encontrado' })
  update(@Param('id') id: string, @Body() dto: UpdateMenuDto): Promise<Menu> {
    return this.menusService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un menú' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Id del menú eliminado' })
  @ApiNotFoundResponse({ description: 'Menú no encontrado' })
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.menusService.remove(id);
    return { id };
  }
}
