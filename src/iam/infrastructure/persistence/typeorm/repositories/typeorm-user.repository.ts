import { Injectable } from '@nestjs/common';
import type { Page, PageRequest } from '../../../../../common/application/pagination.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmBaseRepository } from '../../../../../common/persistence/typeorm-base.repository.js';
import { User } from '../../../../domain/entities/user.entity.js';
import { UserRepository } from '../../../../domain/repositories/user.repository.js';
import { UserOrmEntity } from '../entities/user.orm-entity.js';
import { UserMapper } from '../mappers/user.mapper.js';

@Injectable()
export class TypeOrmUserRepository
  extends TypeOrmBaseRepository<User, UserOrmEntity>
  implements UserRepository
{
  constructor(
    @InjectRepository(UserOrmEntity)
    repository: Repository<UserOrmEntity>,
  ) {
    super(repository);
  }

  protected toDomain(orm: UserOrmEntity): User {
    return UserMapper.toDomain(orm);
  }

  protected toPersistence(domain: User, existing?: UserOrmEntity): UserOrmEntity {
    return UserMapper.toPersistence(domain, existing);
  }

  async findPage(page: PageRequest): Promise<Page<User>> {
    return this.findPageBy({ order: { email: 'ASC' } }, page);
  }

  async findByEmail(email: string): Promise<User | null> {
    const found = await this.repository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
    return found ? this.toDomain(found) : null;
  }
}
