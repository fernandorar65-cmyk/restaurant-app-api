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
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { Order } from './entities/order.entity.js';
import { OrdersService } from './orders.service.js';

@ApiTags('attention/orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una orden' })
  @ApiCreatedResponse({ type: Order })
  create(@Body() dto: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar órdenes' })
  @ApiOkResponse({ type: [Order] })
  findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una orden por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: Order })
  @ApiNotFoundResponse({ description: 'Orden no encontrada' })
  findOne(@Param('id') id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una orden' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: Order })
  @ApiNotFoundResponse({ description: 'Orden no encontrada' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ): Promise<Order> {
    return this.ordersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una orden' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Id de la orden eliminada' })
  @ApiNotFoundResponse({ description: 'Orden no encontrada' })
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.ordersService.remove(id);
    return { id };
  }
}
