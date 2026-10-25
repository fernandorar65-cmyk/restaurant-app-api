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
import { KitchenSuppliesService } from '../../../application/kitchen-supplies/kitchen-supplies.service.js';
import { CreateKitchenSupplyDto } from '../dto/kitchen-supplies/create-kitchen-supply.dto.js';
import { KitchenSupplyResponseDto } from '../dto/kitchen-supplies/kitchen-supply-response.dto.js';
import { UpdateKitchenSupplyDto } from '../dto/kitchen-supplies/update-kitchen-supply.dto.js';

@ApiTags('organizations/kitchen-supplies')
@Controller('kitchen-supplies')
export class KitchenSuppliesController {
  constructor(
    private readonly kitchenSuppliesService: KitchenSuppliesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un insumo de cocina' })
  @ApiCreatedResponse({ type: KitchenSupplyResponseDto })
  async create(
    @Body() dto: CreateKitchenSupplyDto,
  ): Promise<KitchenSupplyResponseDto> {
    const kitchenSupply = await this.kitchenSuppliesService.create(dto);
    return KitchenSupplyResponseDto.fromDomain(kitchenSupply);
  }

  @Get()
  @ApiOperation({ summary: 'Listar insumos de cocina' })
  @ApiOkResponse({ type: [KitchenSupplyResponseDto] })
  async findAll(): Promise<KitchenSupplyResponseDto[]> {
    const kitchenSupplies = await this.kitchenSuppliesService.findAll();
    return kitchenSupplies.map(KitchenSupplyResponseDto.fromDomain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un insumo de cocina por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: KitchenSupplyResponseDto })
  @ApiNotFoundResponse({ description: 'Insumo no encontrado' })
  async findOne(@Param('id') id: string): Promise<KitchenSupplyResponseDto> {
    const kitchenSupply = await this.kitchenSuppliesService.findOne(id);
    return KitchenSupplyResponseDto.fromDomain(kitchenSupply);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un insumo de cocina' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: KitchenSupplyResponseDto })
  @ApiNotFoundResponse({ description: 'Insumo no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateKitchenSupplyDto,
  ): Promise<KitchenSupplyResponseDto> {
    const kitchenSupply = await this.kitchenSuppliesService.update(id, dto);
    return KitchenSupplyResponseDto.fromDomain(kitchenSupply);
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
