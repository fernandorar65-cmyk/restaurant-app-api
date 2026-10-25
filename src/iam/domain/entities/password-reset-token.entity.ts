export interface PasswordResetTokenProps {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

/** Single-use password reset token; only its hash is stored. */
export class PasswordResetToken {
  private constructor(private props: PasswordResetTokenProps) {}

  static create(params: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): PasswordResetToken {
    return new PasswordResetToken({
      ...params,
      usedAt: null,
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: PasswordResetTokenProps): PasswordResetToken {
    return new PasswordResetToken(props);
  }

  get isUsable(): boolean {
    return this.props.usedAt === null && this.props.expiresAt.getTime() > Date.now();
  }

  markUsed(): void {
    this.props.usedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get tokenHash(): string {
    return this.props.tokenHash;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get usedAt(): Date | null {
    return this.props.usedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
