import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { User } from '../../domain/entities/user.entity.js';
import { DuplicateEmailError, UserNotFoundError } from '../../domain/exceptions/user.errors.js';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import { PASSWORD_HASHER } from '../../../common/application/ports/password-hasher.port.js';
import type { PasswordHasher } from '../../../common/application/ports/password-hasher.port.js';
import { RolesService } from '../roles/roles.service.js';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roleId: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  roleId?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    private readonly rolesService: RolesService,
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new DuplicateEmailError(normalizedEmail);
    }
    await this.rolesService.findOne(input.roleId);

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = User.create({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash,
      roleId: input.roleId,
    });
    return this.userRepository.save(user);
  }

  findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }
    return user;
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.findOne(id);

    if (input.roleId) {
      await this.rolesService.findOne(input.roleId);
      user.changeRole(input.roleId);
    }
    if (input.name) {
      user.rename(input.name);
    }
    if (input.email) {
      const normalizedEmail = input.email.trim().toLowerCase();
      const existing = await this.userRepository.findByEmail(normalizedEmail);
      if (existing && existing.id !== user.id) {
        throw new DuplicateEmailError(normalizedEmail);
      }
      user.changeEmail(input.email);
    }
    if (input.password) {
      user.changePasswordHash(await this.passwordHasher.hash(input.password));
    }

    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new UserNotFoundError(id);
    }
  }
}
