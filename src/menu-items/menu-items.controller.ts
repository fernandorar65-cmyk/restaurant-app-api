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
import { CreateMenuItemDto } from './dto/create-menu-item.dto.js';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto.js';
import { MenuItem } from './entities/menu-item.entity.js';
import { MenuItemsService } from './menu-items.service.js';

@ApiTags('menu-items')
@Controller('menu-items')
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un platillo del menú' })
  @ApiCreatedResponse({ type: MenuItem })
  create(@Body() createMenuItemDto: CreateMenuItemDto): MenuItem {
    return this.menuItemsService.create(createMenuItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los platillos del menú' })
  @ApiOkResponse({ type: [MenuItem] })
  findAll(): MenuItem[] {
    return this.menuItemsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un platillo por id' })
  @ApiParam({ name: 'id', description: 'Id del platillo' })
  @ApiOkResponse({ type: MenuItem })
  @ApiNotFoundResponse({ description: 'Platillo no encontrado' })
  findOne(@Param('id') id: string): MenuItem {
    return this.menuItemsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un platillo por id' })
  @ApiParam({ name: 'id', description: 'Id del platillo' })
  @ApiOkResponse({ type: MenuItem })
  @ApiNotFoundResponse({ description: 'Platillo no encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
  ): MenuItem {
    return this.menuItemsService.update(id, updateMenuItemDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un platillo por id' })
  @ApiParam({ name: 'id', description: 'Id del platillo' })
  @ApiOkResponse({ description: 'Id del platillo eliminado' })
  @ApiNotFoundResponse({ description: 'Platillo no encontrado' })
  remove(@Param('id') id: string): { id: string } {
    this.menuItemsService.remove(id);
    return { id };
  }
}
