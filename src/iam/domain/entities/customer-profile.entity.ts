export interface CustomerProfileProps {
  userId: string;
  dietaryPreferences: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Diner-only information of a user (one per user, keyed by user id). */
export class CustomerProfile {
  private constructor(private props: CustomerProfileProps) {}

  static create(params: {
    userId: string;
    dietaryPreferences?: string | null;
  }): CustomerProfile {
    const now = new Date();
    return new CustomerProfile({
      userId: params.userId,
      dietaryPreferences: params.dietaryPreferences ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: CustomerProfileProps): CustomerProfile {
    return new CustomerProfile(props);
  }

  changeDietaryPreferences(dietaryPreferences: string | null): void {
    this.props.dietaryPreferences = dietaryPreferences;
    this.props.updatedAt = new Date();
  }

  get userId(): string {
    return this.props.userId;
  }
  get dietaryPreferences(): string | null {
    return this.props.dietaryPreferences;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
