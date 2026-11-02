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
import { RestaurantFloorsService } from '../../../application/restaurant-floors/restaurant-floors.service.js';
import { CreateRestaurantFloorDto } from '../dto/restaurant-floors/create-restaurant-floor.dto.js';
import { RestaurantFloorResponseDto } from '../dto/restaurant-floors/restaurant-floor-response.dto.js';
import { UpdateRestaurantFloorDto } from '../dto/restaurant-floors/update-restaurant-floor.dto.js';
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

@ApiTags('organizations/restaurant-floors')
@Controller('restaurant-floors')
export class RestaurantFloorsController {
  constructor(private readonly floorsService: RestaurantFloorsService) {}

  @Authorize('restaurants.manage', Scope.restaurant('body'))
  @Post()
  @ApiOperation({ summary: 'Crear un piso de un restaurante' })
  @ApiCreatedResponse({ type: RestaurantFloorResponseDto })
  async create(
    @Body() dto: CreateRestaurantFloorDto,
  ): Promise<RestaurantFloorResponseDto> {
    const floor = await this.floorsService.create(dto);
    return RestaurantFloorResponseDto.fromDomain(floor);
  }

  @Authorize(null, Scope.restaurant('query'))
  @Get()
  @ApiOperation({ summary: 'Listar pisos' })
  @ApiQuery({ name: 'restaurantId', required: false })
  @ApiPaginatedResponse(RestaurantFloorResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('restaurantId', new ParseUUIDPipe({ optional: true }))
    restaurantId?: string,
  ): Promise<PageResponse<RestaurantFloorResponseDto>> {
    const floors = await this.floorsService.findPage({ restaurantId }, page);
    return toPageResponse(floors, (floor) =>
      RestaurantFloorResponseDto.fromDomain(floor),
    );
  }

  @Authorize(null, Scope.resource('restaurant-floor'))
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un piso por id' })
  @ApiOkResponse({ type: RestaurantFloorResponseDto })
  @ApiNotFoundResponse({ description: 'Piso no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RestaurantFloorResponseDto> {
    const floor = await this.floorsService.findOne(id);
    return RestaurantFloorResponseDto.fromDomain(floor);
  }

  @Authorize('restaurants.manage', Scope.resource('restaurant-floor'))
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un piso' })
  @ApiOkResponse({ type: RestaurantFloorResponseDto })
  @ApiNotFoundResponse({ description: 'Piso no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRestaurantFloorDto,
  ): Promise<RestaurantFloorResponseDto> {
    const floor = await this.floorsService.update(id, dto);
    return RestaurantFloorResponseDto.fromDomain(floor);
  }

  @Authorize('restaurants.manage', Scope.resource('restaurant-floor'))
  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar un piso (si no tiene mesas) (baja lógica)',
    description: 'No se borra: queda inactivo para conservar el historial',
  })
  @ApiOkResponse({
    type: IdResponseDto,
    description: 'Id del registro desactivado',
  })
  @ApiNotFoundResponse({ description: 'Piso no encontrado' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ id: string }> {
    await this.floorsService.deactivate(id);
    return { id };
  }
}
