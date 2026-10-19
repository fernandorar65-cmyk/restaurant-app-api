import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersService } from '../orders/orders.service.js';
import { CreateOrderStatusHistoryDto } from './dto/create-order-status-history.dto.js';
import { OrderStatusHistory } from './entities/order-status-history.entity.js';

@Injectable()
export class OrderStatusHistoryService {
  constructor(
    @InjectRepository(OrderStatusHistory)
    private readonly orderStatusHistoryRepository: Repository<OrderStatusHistory>,
    private readonly ordersService: OrdersService,
  ) {}

  async create(
    dto: CreateOrderStatusHistoryDto,
  ): Promise<OrderStatusHistory> {
    await this.ordersService.findOne(dto.orderId);

    const entry = this.orderStatusHistoryRepository.create(dto);
    const saved = await this.orderStatusHistoryRepository.save(entry);

    await this.ordersService.update(dto.orderId, { status: dto.status });

    return saved;
  }

  findAll(): Promise<OrderStatusHistory[]> {
    return this.orderStatusHistoryRepository.find();
  }

  async findOne(id: string): Promise<OrderStatusHistory> {
    const entry = await this.orderStatusHistoryRepository.findOne({
      where: { id },
    });
    if (!entry) {
      throw new NotFoundException(
        `Order status history entry with id "${id}" not found`,
      );
    }
    return entry;
  }

  async remove(id: string): Promise<void> {
    const result = await this.orderStatusHistoryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Order status history entry with id "${id}" not found`,
      );
    }
  }
}
