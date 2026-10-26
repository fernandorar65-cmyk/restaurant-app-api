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
import { SuppliesService } from '../../../application/supplies/supplies.service.js';
import type { RegisterMovementInput } from '../../../application/supplies/supplies.service.js';
import {
  InventoryMovementResponseDto,
  RegisterMovementDto,
} from '../dto/inventory-movement.dto.js';
import {
  CreateSupplyDto,
  SupplyResponseDto,
  UpdateSupplyDto,
} from '../dto/supply.dto.js';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';

@ApiTags('inventory/supplies')
@Controller('supplies')
export class SuppliesController {
  constructor(private readonly suppliesService: SuppliesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un insumo (stock inicial 0)' })
  @ApiCreatedResponse({ type: SupplyResponseDto })
  async create(@Body() dto: CreateSupplyDto): Promise<SupplyResponseDto> {
    const supply = await this.suppliesService.create(dto);
    return SupplyResponseDto.fromDomain(supply);
  }

  @Get()
  @ApiOperation({ summary: 'Listar insumos' })
  @ApiQuery({ name: 'restaurantId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiPaginatedResponse(SupplyResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('restaurantId', new ParseUUIDPipe({ optional: true }))
    restaurantId?: string,
    @Query('categoryId', new ParseUUIDPipe({ optional: true }))
    categoryId?: string,
  ): Promise<PageResponse<SupplyResponseDto>> {
    const supplies = await this.suppliesService.findPage({ restaurantId, categoryId }, page);
    return toPageResponse(supplies, (supply) =>
      SupplyResponseDto.fromDomain(supply),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un insumo' })
  @ApiOkResponse({ type: SupplyResponseDto })
  @ApiNotFoundResponse({ description: 'Insumo no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SupplyResponseDto> {
    const supply = await this.suppliesService.findOne(id);
    return SupplyResponseDto.fromDomain(supply);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de un insumo (no el stock)' })
  @ApiOkResponse({ type: SupplyResponseDto })
  @ApiNotFoundResponse({ description: 'Insumo no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplyDto,
  ): Promise<SupplyResponseDto> {
    const supply = await this.suppliesService.update(id, dto);
    return SupplyResponseDto.fromDomain(supply);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un insumo',
    description: 'Si tiene movimientos, desactívalo (isActive=false) en lugar de eliminarlo',
  })
  @ApiOkResponse({ description: 'Id del insumo eliminado' })
  @ApiNotFoundResponse({ description: 'Insumo no encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.suppliesService.remove(id);
    return { id };
  }

  @Post(':id/movements')
  @ApiOperation({ summary: 'Registrar compra, uso, merma, conteo o ajuste' })
  @ApiCreatedResponse({ type: InventoryMovementResponseDto })
  async registerMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterMovementDto,
  ): Promise<InventoryMovementResponseDto> {
    const { movement } = await this.suppliesService.registerMovement(
      id,
      dto as RegisterMovementInput,
    );
    return InventoryMovementResponseDto.fromDomain(movement);
  }

  @Get(':id/movements')
  @ApiOperation({ summary: 'Historial de movimientos del insumo' })
  @ApiPaginatedResponse(InventoryMovementResponseDto)
  async listMovements(
    @Pagination() page: PageRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PageResponse<InventoryMovementResponseDto>> {
    const movements = await this.suppliesService.listMovements(id, page);
    return toPageResponse(movements, (movement) =>
      InventoryMovementResponseDto.fromDomain(movement),
    );
  }
}
