import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../../domain/entities/user.entity.js';
import { UserRepository } from '../../../../domain/repositories/user.repository.js';
import { UserOrmEntity } from '../entities/user.orm-entity.js';
import { UserMapper } from '../mappers/user.mapper.js';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? UserMapper.toDomain(found) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const found = await this.repository.findOne({ where: { email } });
    return found ? UserMapper.toDomain(found) : null;
  }

  async findAll(): Promise<User[]> {
    const rows = await this.repository.find();
    return rows.map(UserMapper.toDomain);
  }

  async save(user: User): Promise<User> {
    const existing = await this.repository.findOne({ where: { id: user.id } });
    const orm = UserMapper.toPersistence(user, existing ?? undefined);
    const saved = await this.repository.save(orm);
    return UserMapper.toDomain(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
