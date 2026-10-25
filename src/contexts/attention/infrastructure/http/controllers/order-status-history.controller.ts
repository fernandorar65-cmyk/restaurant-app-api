import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { OrderStatusHistoryService } from '../../../application/order-status-history/order-status-history.service.js';
import { CreateOrderStatusHistoryDto } from '../dto/order-status-history/create-order-status-history.dto.js';
import { OrderStatusHistoryResponseDto } from '../dto/order-status-history/order-status-history-response.dto.js';

@ApiTags('attention/order-status-history')
@Controller('order-status-history')
export class OrderStatusHistoryController {
  constructor(
    private readonly orderStatusHistoryService: OrderStatusHistoryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un cambio de estado de una orden' })
  @ApiCreatedResponse({ type: OrderStatusHistoryResponseDto })
  async create(
    @Body() dto: CreateOrderStatusHistoryDto,
  ): Promise<OrderStatusHistoryResponseDto> {
    const entry = await this.orderStatusHistoryService.create(dto);
    return OrderStatusHistoryResponseDto.fromDomain(entry);
  }

  @Get()
  @ApiOperation({ summary: 'Listar historial de estados de órdenes' })
  @ApiOkResponse({ type: [OrderStatusHistoryResponseDto] })
  async findAll(): Promise<OrderStatusHistoryResponseDto[]> {
    const entries = await this.orderStatusHistoryService.findAll();
    return entries.map(OrderStatusHistoryResponseDto.fromDomain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una entrada del historial por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: OrderStatusHistoryResponseDto })
  @ApiNotFoundResponse({ description: 'Entrada no encontrada' })
  async findOne(
    @Param('id') id: string,
  ): Promise<OrderStatusHistoryResponseDto> {
    const entry = await this.orderStatusHistoryService.findOne(id);
    return OrderStatusHistoryResponseDto.fromDomain(entry);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una entrada del historial' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Id de la entrada eliminada' })
  @ApiNotFoundResponse({ description: 'Entrada no encontrada' })
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.orderStatusHistoryService.remove(id);
    return { id };
  }
}
