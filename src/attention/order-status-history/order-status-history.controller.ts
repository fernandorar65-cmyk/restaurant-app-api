import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrderStatusHistoryDto } from './dto/create-order-status-history.dto.js';
import { OrderStatusHistory } from './entities/order-status-history.entity.js';
import { OrderStatusHistoryService } from './order-status-history.service.js';

@ApiTags('attention/order-status-history')
@Controller('order-status-history')
export class OrderStatusHistoryController {
  constructor(
    private readonly orderStatusHistoryService: OrderStatusHistoryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un cambio de estado de una orden' })
  @ApiCreatedResponse({ type: OrderStatusHistory })
  create(
    @Body() dto: CreateOrderStatusHistoryDto,
  ): Promise<OrderStatusHistory> {
    return this.orderStatusHistoryService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar historial de estados de órdenes' })
  @ApiOkResponse({ type: [OrderStatusHistory] })
  findAll(): Promise<OrderStatusHistory[]> {
    return this.orderStatusHistoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una entrada del historial por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: OrderStatusHistory })
  @ApiNotFoundResponse({ description: 'Entrada no encontrada' })
  findOne(@Param('id') id: string): Promise<OrderStatusHistory> {
    return this.orderStatusHistoryService.findOne(id);
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
