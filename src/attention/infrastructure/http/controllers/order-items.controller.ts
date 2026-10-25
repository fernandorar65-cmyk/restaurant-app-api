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
import { OrderItemsService } from '../../../application/order-items/order-items.service.js';
import { CreateOrderItemDto } from '../dto/order-items/create-order-item.dto.js';
import { OrderItemResponseDto } from '../dto/order-items/order-item-response.dto.js';
import { UpdateOrderItemDto } from '../dto/order-items/update-order-item.dto.js';

@ApiTags('attention/order-items')
@Controller('order-items')
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Agregar un platillo a una orden' })
  @ApiCreatedResponse({ type: OrderItemResponseDto })
  async create(
    @Body() dto: CreateOrderItemDto,
  ): Promise<OrderItemResponseDto> {
    const orderItem = await this.orderItemsService.create(dto);
    return OrderItemResponseDto.fromDomain(orderItem);
  }

  @Get()
  @ApiOperation({ summary: 'Listar items de órdenes' })
  @ApiOkResponse({ type: [OrderItemResponseDto] })
  async findAll(): Promise<OrderItemResponseDto[]> {
    const orderItems = await this.orderItemsService.findAll();
    return orderItems.map(OrderItemResponseDto.fromDomain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un item de orden por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: OrderItemResponseDto })
  @ApiNotFoundResponse({ description: 'Item no encontrado' })
  async findOne(@Param('id') id: string): Promise<OrderItemResponseDto> {
    const orderItem = await this.orderItemsService.findOne(id);
    return OrderItemResponseDto.fromDomain(orderItem);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un item de orden' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: OrderItemResponseDto })
  @ApiNotFoundResponse({ description: 'Item no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderItemDto,
  ): Promise<OrderItemResponseDto> {
    const orderItem = await this.orderItemsService.update(id, dto);
    return OrderItemResponseDto.fromDomain(orderItem);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un item de orden' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Id del item eliminado' })
  @ApiNotFoundResponse({ description: 'Item no encontrado' })
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.orderItemsService.remove(id);
    return { id };
  }
}
