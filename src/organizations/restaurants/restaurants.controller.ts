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
import { CreateRestaurantDto } from './dto/create-restaurant.dto.js';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto.js';
import { Restaurant } from './entities/restaurant.entity.js';
import { RestaurantsService } from './restaurants.service.js';

@ApiTags('organizations/restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un restaurante' })
  @ApiCreatedResponse({ type: Restaurant })
  create(@Body() dto: CreateRestaurantDto): Promise<Restaurant> {
    return this.restaurantsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar restaurantes' })
  @ApiOkResponse({ type: [Restaurant] })
  findAll(): Promise<Restaurant[]> {
    return this.restaurantsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un restaurante por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: Restaurant })
  @ApiNotFoundResponse({ description: 'Restaurante no encontrado' })
  findOne(@Param('id') id: string): Promise<Restaurant> {
    return this.restaurantsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un restaurante' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: Restaurant })
  @ApiNotFoundResponse({ description: 'Restaurante no encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
  ): Promise<Restaurant> {
    return this.restaurantsService.update(id, dto);
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
