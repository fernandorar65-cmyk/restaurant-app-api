import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { Customer } from '../../../../domain/entities/customer.entity.js';
import { CustomerRepository } from '../../../../domain/repositories/customer.repository.js';
import { CustomerOrmEntity } from '../entities/customer.orm-entity.js';
import { CustomerMapper } from '../mappers/customer.mapper.js';

@Injectable()
export class TypeOrmCustomerRepository
  extends TypeOrmBaseRepository<Customer, CustomerOrmEntity>
  implements CustomerRepository
{
  constructor(
    @InjectRepository(CustomerOrmEntity)
    repository: Repository<CustomerOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: CustomerOrmEntity): Customer {
    return CustomerMapper.toDomain(orm);
  }

  protected toPersistence(
    domain: Customer,
    existing?: CustomerOrmEntity,
  ): CustomerOrmEntity {
    return CustomerMapper.toPersistence(domain, existing);
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const found = await this.repository.findOne({ where: { email } });
    return found ? this.toDomain(found) : null;
  }

  async findByResetTokenHash(tokenHash: string): Promise<Customer | null> {
    const found = await this.repository.findOne({
      where: { resetPasswordTokenHash: tokenHash },
    });
    return found ? this.toDomain(found) : null;
  }
}
