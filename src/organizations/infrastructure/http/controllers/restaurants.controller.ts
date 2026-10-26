import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
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
import { RestaurantOrderModesService } from '../../../application/restaurant-order-modes/restaurant-order-modes.service.js';
import { RestaurantsService } from '../../../application/restaurants/restaurants.service.js';
import { OrderMode } from '../../../domain/enums/order-mode.enum.js';
import { CreateRestaurantDto } from '../dto/restaurants/create-restaurant.dto.js';
import {
  ConfigureOrderModeDto,
  RestaurantOrderModeResponseDto,
} from '../dto/restaurants/restaurant-order-mode.dto.js';
import { RestaurantResponseDto } from '../dto/restaurants/restaurant-response.dto.js';
import { UpdateRestaurantDto } from '../dto/restaurants/update-restaurant.dto.js';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';

@ApiTags('organizations/restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly orderModesService: RestaurantOrderModesService,
  ) {}

  @Get(':id/order-modes')
  @ApiOperation({
    summary: 'Modalidades de la sede (mesa, recojo, delivery)',
    description:
      'Siempre devuelve las tres. Sin configurar, solo DINE_IN está habilitada',
  })
  @ApiOkResponse({ type: [RestaurantOrderModeResponseDto] })
  async listOrderModes(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RestaurantOrderModeResponseDto[]> {
    const orderModes = await this.orderModesService.list(id);
    return orderModes.map((orderMode) =>
      RestaurantOrderModeResponseDto.fromDomain(orderMode),
    );
  }

  @Put(':id/order-modes/:mode')
  @ApiOperation({ summary: 'Configurar una modalidad: habilitada, monto mínimo, costo de envío' })
  @ApiOkResponse({ type: RestaurantOrderModeResponseDto })
  async configureOrderMode(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mode', new ParseEnumPipe(OrderMode)) mode: OrderMode,
    @Body() dto: ConfigureOrderModeDto,
  ): Promise<RestaurantOrderModeResponseDto> {
    const orderMode = await this.orderModesService.configure(id, mode, dto);
    return RestaurantOrderModeResponseDto.fromDomain(orderMode);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un restaurante (sede)' })
  @ApiCreatedResponse({ type: RestaurantResponseDto })
  async create(
    @Body() dto: CreateRestaurantDto,
  ): Promise<RestaurantResponseDto> {
    const restaurant = await this.restaurantsService.create(dto);
    return RestaurantResponseDto.fromDomain(restaurant);
  }

  @Get()
  @ApiOperation({ summary: 'Listar restaurantes' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiPaginatedResponse(RestaurantResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('organizationId', new ParseUUIDPipe({ optional: true }))
    organizationId?: string,
  ): Promise<PageResponse<RestaurantResponseDto>> {
    const restaurants = await this.restaurantsService.findPage({ organizationId }, page);
    return toPageResponse(restaurants, (restaurant) =>
      RestaurantResponseDto.fromDomain(restaurant),
    );
  }

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

  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar un restaurante (baja lógica)',
    description: 'No se borra: queda inactivo para conservar el historial',
  })
  @ApiOkResponse({ description: 'Id del registro desactivado' })
  @ApiNotFoundResponse({ description: 'Restaurante no encontrado' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.restaurantsService.deactivate(id);
    return { id };
  }
}
