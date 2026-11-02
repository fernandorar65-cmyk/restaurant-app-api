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
import { RestaurantsService } from '../../../application/restaurants/restaurants.service.js';
import { CreateRestaurantDto } from '../dto/restaurants/create-restaurant.dto.js';
import { RestaurantResponseDto } from '../dto/restaurants/restaurant-response.dto.js';
import { UpdateRestaurantDto } from '../dto/restaurants/update-restaurant.dto.js';
import type { PageRequest } from '../../../../common/domain/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';
import {
  Authorize,
  Scope,
} from '../../../../common/infrastructure/http/access/authorize.decorator.js';
import { IdResponseDto } from '../../../../common/infrastructure/http/id-response.dto.js';

@ApiTags('organizations/restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Authorize('restaurants.manage', Scope.organization('body'))
  @Post()
  @ApiOperation({ summary: 'Crear un restaurante (sede)' })
  @ApiCreatedResponse({ type: RestaurantResponseDto })
  async create(
    @Body() dto: CreateRestaurantDto,
  ): Promise<RestaurantResponseDto> {
    const restaurant = await this.restaurantsService.create(dto);
    return RestaurantResponseDto.fromDomain(restaurant);
  }

  @Authorize(null, Scope.organization('query'))
  @Get()
  @ApiOperation({ summary: 'Listar restaurantes' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiPaginatedResponse(RestaurantResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('organizationId', new ParseUUIDPipe({ optional: true }))
    organizationId?: string,
  ): Promise<PageResponse<RestaurantResponseDto>> {
    const restaurants = await this.restaurantsService.findPage(
      { organizationId },
      page,
    );
    return toPageResponse(restaurants, (restaurant) =>
      RestaurantResponseDto.fromDomain(restaurant),
    );
  }

  @Authorize(null, Scope.resource('restaurant'))
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un restaurante por id' })
  @ApiOkResponse({ type: RestaurantResponseDto })
  @ApiNotFoundResponse({ description: 'Restaurante no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RestaurantResponseDto> {
    const restaurant = await this.restaurantsService.findOne(id);
    return RestaurantResponseDto.fromDomain(restaurant);
  }

  @Authorize('restaurants.manage', Scope.resource('restaurant'))
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un restaurante' })
  @ApiOkResponse({ type: RestaurantResponseDto })
  @ApiNotFoundResponse({ description: 'Restaurante no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRestaurantDto,
  ): Promise<RestaurantResponseDto> {
    const restaurant = await this.restaurantsService.update(id, dto);
    return RestaurantResponseDto.fromDomain(restaurant);
  }

  @Authorize('restaurants.manage', Scope.resource('restaurant'))
  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar un restaurante (baja lógica)',
    description: 'No se borra: queda inactivo para conservar el historial',
  })
  @ApiOkResponse({
    type: IdResponseDto,
    description: 'Id del registro desactivado',
  })
  @ApiNotFoundResponse({ description: 'Restaurante no encontrado' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ id: string }> {
    await this.restaurantsService.deactivate(id);
    return { id };
  }
}
