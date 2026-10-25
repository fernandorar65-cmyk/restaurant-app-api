import { Inject, Injectable } from '@nestjs/common';
import { Customer } from '../../domain/entities/customer.entity.js';
import { CustomerNotFoundError } from '../../domain/exceptions/customer.errors.js';
import { CUSTOMER_REPOSITORY } from '../../domain/repositories/customer.repository.js';
import type { CustomerRepository } from '../../domain/repositories/customer.repository.js';

@Injectable()
export class CustomersService {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
  ) {}

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new CustomerNotFoundError(id);
    }
    return customer;
  }

  async exists(id: string): Promise<boolean> {
    const customer = await this.customerRepository.findById(id);
    return customer !== null;
  }
}
