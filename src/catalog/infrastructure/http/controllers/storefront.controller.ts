import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { StorefrontService } from '../../../application/storefront/storefront.service.js';
import {
  StorefrontMenuResponseDto,
  StorefrontProductResponseDto,
  StorefrontRestaurantResponseDto,
} from '../dto/storefront/storefront.dto.js';
import type { PageRequest } from '../../../../common/domain/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';
import { Public } from '../../../../common/infrastructure/http/public.decorator.js';

const MAX_SUGGESTIONS = 20;

/** What a diner sees before ordering: restaurants and their current menu. */
@ApiTags('customer/storefront')
@Public()
@Controller('api/v1/restaurants')
export class StorefrontController {
  constructor(private readonly storefront: StorefrontService) {}

  @Get()
  @ApiOperation({
    summary: 'Sedes activas visibles para el comensal',
    description:
      'Con ubicación y modalidades activas (mínimo y costo de envío)',
  })
  @ApiPaginatedResponse(StorefrontRestaurantResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
  ): Promise<PageResponse<StorefrontRestaurantResponseDto>> {
    const restaurants = await this.storefront.findRestaurantPage(page);
    return toPageResponse(restaurants, (restaurant) =>
      StorefrontRestaurantResponseDto.from(restaurant),
    );
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Sede por su slug (abrir la carta por URL)' })
  @ApiOkResponse({ type: StorefrontRestaurantResponseDto })
  @ApiNotFoundResponse({ description: 'No existe o no está activa' })
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<StorefrontRestaurantResponseDto> {
    return StorefrontRestaurantResponseDto.from(
      await this.storefront.findRestaurantBySlug(slug),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Datos públicos de una sede' })
  @ApiOkResponse({ type: StorefrontRestaurantResponseDto })
  @ApiNotFoundResponse({ description: 'No existe o no está activa' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StorefrontRestaurantResponseDto> {
    return StorefrontRestaurantResponseDto.from(
      await this.storefront.findRestaurant(id),
    );
  }

  @Get(':id/menu')
  @ApiOperation({
    summary: 'Carta vigente de la sede',
    description:
      'Menú ACTIVE dentro de su vigencia (si hay varios, el que empezó más tarde), sus secciones activas y sus productos visibles y activos. Los agotados vienen con isAvailable=false. Sin menú vigente: menu=null y listas vacías',
  })
  @ApiOkResponse({ type: StorefrontMenuResponseDto })
  @ApiNotFoundResponse({ description: 'No existe o no está activa' })
  async menu(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StorefrontMenuResponseDto> {
    return StorefrontMenuResponseDto.from(
      await this.storefront.currentMenu(id),
    );
  }

  @Get(':id/menu/search')
  @ApiOperation({
    summary: 'Sugerencias del buscador de la carta',
    description:
      'Busca en nombre y descripción de los productos de la carta vigente, sin distinguir mayúsculas ni tildes. Primero coincidencias por inicio del nombre',
  })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'limit', required: false, example: 6 })
  @ApiOkResponse({ type: [StorefrontProductResponseDto] })
  async search(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('q', new DefaultValuePipe('')) q: string,
    @Query('limit', new DefaultValuePipe(6), ParseIntPipe) limit: number,
  ): Promise<StorefrontProductResponseDto[]> {
    const products = await this.storefront.searchCurrentMenu(
      id,
      q,
      Math.min(Math.max(limit, 1), MAX_SUGGESTIONS),
    );
    return products.map((product) =>
      StorefrontProductResponseDto.from(product),
    );
  }
}
