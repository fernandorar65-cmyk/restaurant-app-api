import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthSession } from './entities/auth-session.entity.js';
import { User } from './entities/user.entity.js';

const scryptAsync = promisify(scrypt);

type StoredUser = User & {
  passwordHash: Buffer;
  passwordSalt: Buffer;
};

@Injectable()
export class AuthService {
  private readonly users: StoredUser[] = [];
  private readonly sessions = new Map<string, string>();

  async register(dto: RegisterDto): Promise<AuthSession> {
    const email = this.normalizeEmail(dto.email);

    if (this.users.some((user) => user.email === email)) {
      throw new ConflictException('Ya existe una cuenta con este correo');
    }

    const passwordSalt = randomBytes(16);
    const passwordHash = await this.hashPassword(dto.password, passwordSalt);

    const user: StoredUser = {
      id: randomUUID(),
      name: dto.name.trim(),
      email,
      passwordHash,
      passwordSalt,
    };

    this.users.push(user);

    return this.createSession(user);
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const email = this.normalizeEmail(dto.email);
    const user = this.users.find((storedUser) => storedUser.email === email);

    if (!user || !(await this.isPasswordValid(dto.password, user))) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    return this.createSession(user);
  }

  private createSession(user: StoredUser): AuthSession {
    const accessToken = randomUUID();
    this.sessions.set(accessToken, user.id);

    return {
      accessToken,
      user: this.toPublicUser(user),
    };
  }

  private toPublicUser(user: StoredUser): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async hashPassword(password: string, salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(password, salt, 64)) as Buffer;
  }

  private async isPasswordValid(
    password: string,
    user: StoredUser,
  ): Promise<boolean> {
    const candidate = await this.hashPassword(password, user.passwordSalt);

    if (candidate.length !== user.passwordHash.length) {
      return false;
    }

    return timingSafeEqual(candidate, user.passwordHash);
  }
}
