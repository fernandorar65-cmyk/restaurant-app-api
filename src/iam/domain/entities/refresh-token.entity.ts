export interface RefreshTokenProps {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class RefreshToken {
  private constructor(private props: RefreshTokenProps) {}

  static create(params: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): RefreshToken {
    const now = new Date();
    return new RefreshToken({
      id: params.id,
      userId: params.userId,
      tokenHash: params.tokenHash,
      expiresAt: params.expiresAt,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props);
  }

  revoke(): void {
    this.props.revokedAt = new Date();
    this.props.updatedAt = new Date();
  }

  get isActive(): boolean {
    return this.props.revokedAt === null && this.props.expiresAt.getTime() > Date.now();
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
  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
