import { ValidationDomainError } from '../../../common/domain/domain-error.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UserProps {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  roleId: string;
  resetPasswordTokenHash: string | null;
  resetPasswordExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  static create(params: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    roleId: string;
  }): User {
    User.validateName(params.name);
    User.validateEmail(params.email);
    const now = new Date();
    return new User({
      id: params.id,
      name: params.name,
      email: params.email.trim().toLowerCase(),
      passwordHash: params.passwordHash,
      roleId: params.roleId,
      resetPasswordTokenHash: null,
      resetPasswordExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  private static validateName(name: string): void {
    if (name.trim().length < 2) {
      throw new ValidationDomainError('El nombre del usuario debe tener al menos 2 caracteres');
    }
  }

  private static validateEmail(email: string): void {
    if (!EMAIL_REGEX.test(email)) {
      throw new ValidationDomainError(`"${email}" no es un correo válido`);
    }
  }

  rename(name: string): void {
    User.validateName(name);
    this.props.name = name;
    this.touch();
  }

  changeEmail(email: string): void {
    User.validateEmail(email);
    this.props.email = email.trim().toLowerCase();
    this.touch();
  }

  changePasswordHash(passwordHash: string): void {
    this.props.passwordHash = passwordHash;
    this.touch();
  }

  changeRole(roleId: string): void {
    this.props.roleId = roleId;
    this.touch();
  }

  setPasswordResetToken(tokenHash: string, expiresAt: Date): void {
    this.props.resetPasswordTokenHash = tokenHash;
    this.props.resetPasswordExpiresAt = expiresAt;
    this.touch();
  }

  clearPasswordResetToken(): void {
    this.props.resetPasswordTokenHash = null;
    this.props.resetPasswordExpiresAt = null;
    this.touch();
  }

  hasValidPasswordResetToken(tokenHash: string): boolean {
    return (
      this.props.resetPasswordTokenHash === tokenHash &&
      this.props.resetPasswordExpiresAt !== null &&
      this.props.resetPasswordExpiresAt.getTime() > Date.now()
    );
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get roleId(): string {
    return this.props.roleId;
  }

  get resetPasswordTokenHash(): string | null {
    return this.props.resetPasswordTokenHash;
  }

  get resetPasswordExpiresAt(): Date | null {
    return this.props.resetPasswordExpiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
