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
import { RestaurantsService } from '../../../application/restaurants/restaurants.service.js';
import { CreateRestaurantDto } from '../dto/restaurants/create-restaurant.dto.js';
import { RestaurantResponseDto } from '../dto/restaurants/restaurant-response.dto.js';
import { UpdateRestaurantDto } from '../dto/restaurants/update-restaurant.dto.js';

@ApiTags('organizations/restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un restaurante' })
  @ApiCreatedResponse({ type: RestaurantResponseDto })
  async create(
    @Body() dto: CreateRestaurantDto,
  ): Promise<RestaurantResponseDto> {
    const restaurant = await this.restaurantsService.create(dto);
    return RestaurantResponseDto.fromDomain(restaurant);
  }

  @Get()
  @ApiOperation({ summary: 'Listar restaurantes' })
  @ApiOkResponse({ type: [RestaurantResponseDto] })
  async findAll(): Promise<RestaurantResponseDto[]> {
    const restaurants = await this.restaurantsService.findAll();
    return restaurants.map(RestaurantResponseDto.fromDomain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un restaurante por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: RestaurantResponseDto })
  @ApiNotFoundResponse({ description: 'Restaurante no encontrado' })
  async findOne(@Param('id') id: string): Promise<RestaurantResponseDto> {
    const restaurant = await this.restaurantsService.findOne(id);
    return RestaurantResponseDto.fromDomain(restaurant);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un restaurante' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: RestaurantResponseDto })
  @ApiNotFoundResponse({ description: 'Restaurante no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
  ): Promise<RestaurantResponseDto> {
    const restaurant = await this.restaurantsService.update(id, dto);
    return RestaurantResponseDto.fromDomain(restaurant);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un restaurante' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Id del restaurante eliminado' })
  @ApiNotFoundResponse({ description: 'Restaurante no encontrado' })
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.restaurantsService.remove(id);
    return { id };
  }
}
