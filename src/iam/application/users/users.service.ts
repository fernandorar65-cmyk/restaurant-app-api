import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PASSWORD_HASHER } from '../../../common/application/ports/password-hasher.port.js';
import type { PasswordHasher } from '../../../common/application/ports/password-hasher.port.js';
import { User } from '../../domain/entities/user.entity.js';
import type { UserProfileDetails } from '../../domain/entities/user.entity.js';
import { UserStatus } from '../../domain/enums/user-status.enum.js';
import {
  DuplicateEmailError,
  UserNotFoundError,
} from '../../domain/exceptions/user.errors.js';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';

export interface CreateUserInput extends UserProfileDetails {
  email: string;
  password: string;
  firstName: string;
  /** Forces a password change on first login (temporary password). */
  mustChangePassword?: boolean;
}

export interface UpdateUserInput extends UserProfileDetails {
  email?: string;
  password?: string;
  status?: UserStatus;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    await this.assertEmailIsFree(input.email);
    const user = User.create({
      ...input,
      id: randomUUID(),
      passwordHash: await this.passwordHasher.hash(input.password),
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
    user.updateProfile(input);
    if (input.email !== undefined) {
      await this.assertEmailIsFree(input.email, user.id);
      user.changeEmail(input.email);
    }
    if (input.password !== undefined) {
      user.changePasswordHash(await this.passwordHasher.hash(input.password));
    }
    if (input.status !== undefined) {
      user.changeStatus(input.status);
    }
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new UserNotFoundError(id);
    }
  }

  private async assertEmailIsFree(email: string, ownerId?: string): Promise<void> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing && existing.id !== ownerId) {
      throw new DuplicateEmailError(existing.email);
    }
  }
}
