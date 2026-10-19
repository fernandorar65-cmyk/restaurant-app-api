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
import { CreateOrderItemDto } from './dto/create-order-item.dto.js';
import { UpdateOrderItemDto } from './dto/update-order-item.dto.js';
import { OrderItem } from './entities/order-item.entity.js';
import { OrderItemsService } from './order-items.service.js';

@ApiTags('attention/order-items')
@Controller('order-items')
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Agregar un platillo a una orden' })
  @ApiCreatedResponse({ type: OrderItem })
  create(@Body() dto: CreateOrderItemDto): Promise<OrderItem> {
    return this.orderItemsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar items de órdenes' })
  @ApiOkResponse({ type: [OrderItem] })
  findAll(): Promise<OrderItem[]> {
    return this.orderItemsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un item de orden por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: OrderItem })
  @ApiNotFoundResponse({ description: 'Item no encontrado' })
  findOne(@Param('id') id: string): Promise<OrderItem> {
    return this.orderItemsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un item de orden' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: OrderItem })
  @ApiNotFoundResponse({ description: 'Item no encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderItemDto,
  ): Promise<OrderItem> {
    return this.orderItemsService.update(id, dto);
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
