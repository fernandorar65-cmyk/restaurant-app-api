import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from '../../organizations/products/products.service.js';
import { OrdersService } from '../orders/orders.service.js';
import { CreateOrderItemDto } from './dto/create-order-item.dto.js';
import { UpdateOrderItemDto } from './dto/update-order-item.dto.js';
import { OrderItem } from './entities/order-item.entity.js';

@Injectable()
export class OrderItemsService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
  ) {}

  async create(dto: CreateOrderItemDto): Promise<OrderItem> {
    await this.ordersService.findOne(dto.orderId);
    const product = await this.productsService.findOne(dto.productId);

    const orderItem = this.orderItemsRepository.create({
      ...dto,
      unitPrice: product.price,
    });
    return this.orderItemsRepository.save(orderItem);
  }

  findAll(): Promise<OrderItem[]> {
    return this.orderItemsRepository.find();
  }

  async findOne(id: string): Promise<OrderItem> {
    const orderItem = await this.orderItemsRepository.findOne({
      where: { id },
    });
    if (!orderItem) {
      throw new NotFoundException(`Order item with id "${id}" not found`);
    }
    return orderItem;
  }

  async update(id: string, dto: UpdateOrderItemDto): Promise<OrderItem> {
    const orderItem = await this.findOne(id);
    Object.assign(orderItem, dto);
    return this.orderItemsRepository.save(orderItem);
  }

  async remove(id: string): Promise<void> {
    const result = await this.orderItemsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Order item with id "${id}" not found`);
    }
  }
}
