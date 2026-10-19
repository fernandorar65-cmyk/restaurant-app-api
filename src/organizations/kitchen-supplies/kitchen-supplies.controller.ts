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
import { CreateKitchenSupplyDto } from './dto/create-kitchen-supply.dto.js';
import { UpdateKitchenSupplyDto } from './dto/update-kitchen-supply.dto.js';
import { KitchenSupply } from './entities/kitchen-supply.entity.js';
import { KitchenSuppliesService } from './kitchen-supplies.service.js';

@ApiTags('organizations/kitchen-supplies')
@Controller('kitchen-supplies')
export class KitchenSuppliesController {
  constructor(
    private readonly kitchenSuppliesService: KitchenSuppliesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un insumo de cocina' })
  @ApiCreatedResponse({ type: KitchenSupply })
  create(@Body() dto: CreateKitchenSupplyDto): Promise<KitchenSupply> {
    return this.kitchenSuppliesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar insumos de cocina' })
  @ApiOkResponse({ type: [KitchenSupply] })
  findAll(): Promise<KitchenSupply[]> {
    return this.kitchenSuppliesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un insumo de cocina por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: KitchenSupply })
  @ApiNotFoundResponse({ description: 'Insumo no encontrado' })
  findOne(@Param('id') id: string): Promise<KitchenSupply> {
    return this.kitchenSuppliesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un insumo de cocina' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: KitchenSupply })
  @ApiNotFoundResponse({ description: 'Insumo no encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateKitchenSupplyDto,
  ): Promise<KitchenSupply> {
    return this.kitchenSuppliesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un insumo de cocina' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Id del insumo eliminado' })
  @ApiNotFoundResponse({ description: 'Insumo no encontrado' })
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.kitchenSuppliesService.remove(id);
    return { id };
  }
}
