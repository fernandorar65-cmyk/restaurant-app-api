import { ValidationDomainError } from '../../../common/domain/domain-error.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CustomerProps {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  marketingOptIn: boolean;
  resetPasswordTokenHash: string | null;
  resetPasswordExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Customer {
  private constructor(private props: CustomerProps) {}

  static create(params: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    phone?: string;
    marketingOptIn?: boolean;
  }): Customer {
    Customer.validateName(params.name);
    Customer.validateEmail(params.email);
    const now = new Date();
    return new Customer({
      id: params.id,
      name: params.name,
      email: params.email.trim().toLowerCase(),
      passwordHash: params.passwordHash,
      phone: params.phone ?? null,
      marketingOptIn: params.marketingOptIn ?? false,
      resetPasswordTokenHash: null,
      resetPasswordExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: CustomerProps): Customer {
    return new Customer(props);
  }

  private static validateName(name: string): void {
    if (name.trim().length < 2) {
      throw new ValidationDomainError(
        'El nombre del comensal debe tener al menos 2 caracteres',
      );
    }
  }

  private static validateEmail(email: string): void {
    if (!EMAIL_REGEX.test(email)) {
      throw new ValidationDomainError(`"${email}" no es un correo válido`);
    }
  }

  changePasswordHash(passwordHash: string): void {
    this.props.passwordHash = passwordHash;
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
  get phone(): string | null {
    return this.props.phone;
  }
  get marketingOptIn(): boolean {
    return this.props.marketingOptIn;
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
