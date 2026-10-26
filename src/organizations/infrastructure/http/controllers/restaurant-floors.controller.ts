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
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';

@ApiTags('organizations/restaurant-floors')
@Controller('restaurant-floors')
export class RestaurantFloorsController {
  constructor(private readonly floorsService: RestaurantFloorsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un piso de un restaurante' })
  @ApiCreatedResponse({ type: RestaurantFloorResponseDto })
  async create(
    @Body() dto: CreateRestaurantFloorDto,
  ): Promise<RestaurantFloorResponseDto> {
    const floor = await this.floorsService.create(dto);
    return RestaurantFloorResponseDto.fromDomain(floor);
  }

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

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un piso (si no tiene mesas)' })
  @ApiOkResponse({ description: 'Id del piso eliminado' })
  @ApiNotFoundResponse({ description: 'Piso no encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.floorsService.remove(id);
    return { id };
  }
}
