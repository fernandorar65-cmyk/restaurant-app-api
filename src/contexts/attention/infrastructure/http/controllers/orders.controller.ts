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
import { OrdersService } from '../../../application/orders/orders.service.js';
import { CreateOrderDto } from '../dto/orders/create-order.dto.js';
import { OrderResponseDto } from '../dto/orders/order-response.dto.js';
import { UpdateOrderDto } from '../dto/orders/update-order.dto.js';

@ApiTags('attention/orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una orden' })
  @ApiCreatedResponse({ type: OrderResponseDto })
  async create(@Body() dto: CreateOrderDto): Promise<OrderResponseDto> {
    const order = await this.ordersService.create(dto);
    return OrderResponseDto.fromDomain(order);
  }

  @Get()
  @ApiOperation({ summary: 'Listar órdenes' })
  @ApiOkResponse({ type: [OrderResponseDto] })
  async findAll(): Promise<OrderResponseDto[]> {
    const orders = await this.ordersService.findAll();
    return orders.map(OrderResponseDto.fromDomain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una orden por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: OrderResponseDto })
  @ApiNotFoundResponse({ description: 'Orden no encontrada' })
  async findOne(@Param('id') id: string): Promise<OrderResponseDto> {
    const order = await this.ordersService.findOne(id);
    return OrderResponseDto.fromDomain(order);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una orden' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: OrderResponseDto })
  @ApiNotFoundResponse({ description: 'Orden no encontrada' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.update(id, dto);
    return OrderResponseDto.fromDomain(order);
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
