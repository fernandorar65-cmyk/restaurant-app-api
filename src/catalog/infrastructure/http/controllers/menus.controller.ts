import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { MenusService } from '../../../application/menus/menus.service.js';
import { CreateMenuDto } from '../dto/menus/create-menu.dto.js';
import {
  AddMenuProductDto,
  MenuProductResponseDto,
  UpdateMenuProductDto,
} from '../dto/menus/menu-product.dto.js';
import { MenuResponseDto } from '../dto/menus/menu-response.dto.js';
import { UpdateMenuDto } from '../dto/menus/update-menu.dto.js';

@ApiTags('catalog/menus')
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
  @ApiQuery({ name: 'restaurantId', required: false })
  @ApiOkResponse({ type: [MenuResponseDto] })
  async findAll(
    @Query('restaurantId', new ParseUUIDPipe({ optional: true }))
    restaurantId?: string,
  ): Promise<MenuResponseDto[]> {
    const menus = await this.menusService.findAll({ restaurantId });
    return menus.map((menu) => MenuResponseDto.fromDomain(menu));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un menú por id' })
  @ApiOkResponse({ type: MenuResponseDto })
  @ApiNotFoundResponse({ description: 'Menú no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MenuResponseDto> {
    const menu = await this.menusService.findOne(id);
    return MenuResponseDto.fromDomain(menu);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un menú (incluye estado y vigencia)' })
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
  @ApiOkResponse({ description: 'Id del menú eliminado' })
  @ApiNotFoundResponse({ description: 'Menú no encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.menusService.remove(id);
    return { id };
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Productos del menú' })
  @ApiOkResponse({ type: [MenuProductResponseDto] })
  async listProducts(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MenuProductResponseDto[]> {
    const menuProducts = await this.menusService.listProducts(id);
    return menuProducts.map((menuProduct) =>
      MenuProductResponseDto.fromDomain(menuProduct),
    );
  }

  @Post(':id/products')
  @ApiOperation({ summary: 'Agregar un producto del mismo restaurante al menú' })
  @ApiCreatedResponse({ type: MenuProductResponseDto })
  async addProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMenuProductDto,
  ): Promise<MenuProductResponseDto> {
    const { productId, ...options } = dto;
    const menuProduct = await this.menusService.addProduct(id, productId, options);
    return MenuProductResponseDto.fromDomain(menuProduct);
  }

  @Patch(':id/products/:productId')
  @ApiOperation({ summary: 'Cambiar precio mostrado, orden o visibilidad' })
  @ApiOkResponse({ type: MenuProductResponseDto })
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateMenuProductDto,
  ): Promise<MenuProductResponseDto> {
    const menuProduct = await this.menusService.updateProduct(id, productId, dto);
    return MenuProductResponseDto.fromDomain(menuProduct);
  }

  @Delete(':id/products/:productId')
  @ApiOperation({ summary: 'Quitar un producto del menú' })
  @ApiOkResponse({ description: 'Producto quitado del menú' })
  async removeProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<{ menuId: string; productId: string }> {
    await this.menusService.removeProduct(id, productId);
    return { menuId: id, productId };
  }
}
