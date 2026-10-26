import { Email } from '../../../common/domain/value-objects/email.js';
import { requireText } from '../../../common/domain/value-objects/required-text.js';
import { UserStatus } from '../enums/user-status.enum.js';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  status: UserStatus;
  mustChangePassword: boolean;
  /**
   * ACMR staff that administers platform-wide catalogs (payment statuses,
   * gateway mappings). Never set through the API: only in the database.
   */
  isPlatformAdmin: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileDetails {
  firstName?: string;
  lastName?: string | null;
  phone?: string | null;
}

/**
 * The single global identity. The same user can be a diner, an owner of one
 * organization and staff in another: those are roles (memberships) and
 * profiles, never different kinds of users.
 */
export class User {
  private constructor(private props: UserProps) {}

  static create(
    params: UserProfileDetails & {
      id: string;
      email: string;
      passwordHash: string;
      firstName: string;
      mustChangePassword?: boolean;
    },
  ): User {
    const now = new Date();
    const user = new User({
      id: params.id,
      email: Email.create(params.email).value,
      passwordHash: params.passwordHash,
      firstName: '',
      lastName: null,
      phone: null,
      status: UserStatus.ACTIVE,
      mustChangePassword: params.mustChangePassword ?? false,
      isPlatformAdmin: false,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });
    user.applyProfile(params);
    return user;
  }

  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  updateProfile(params: UserProfileDetails): void {
    this.applyProfile(params);
    this.touch();
  }

  changeEmail(email: string): void {
    this.props.email = Email.create(email).value;
    this.touch();
  }

  changePasswordHash(passwordHash: string): void {
    this.props.passwordHash = passwordHash;
    this.props.mustChangePassword = false;
    this.touch();
  }

  changeStatus(status: UserStatus): void {
    this.props.status = status;
    this.touch();
  }

  recordLogin(): void {
    this.props.lastLoginAt = new Date();
    this.touch();
  }

  get canLogIn(): boolean {
    return this.props.status === UserStatus.ACTIVE;
  }

  get fullName(): string {
    return [this.props.firstName, this.props.lastName].filter(Boolean).join(' ');
  }

  private applyProfile(params: UserProfileDetails): void {
    if (params.firstName !== undefined) {
      this.props.firstName = requireText(params.firstName, 'El nombre', {
        max: 100,
      });
    }
    if (params.lastName !== undefined) {
      this.props.lastName = params.lastName?.trim() || null;
    }
    if (params.phone !== undefined) {
      this.props.phone = params.phone?.trim() || null;
    }
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get email(): string {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get firstName(): string {
    return this.props.firstName;
  }
  get lastName(): string | null {
    return this.props.lastName;
  }
  get phone(): string | null {
    return this.props.phone;
  }
  get status(): UserStatus {
    return this.props.status;
  }
  get mustChangePassword(): boolean {
    return this.props.mustChangePassword;
  }
  get isPlatformAdmin(): boolean {
    return this.props.isPlatformAdmin;
  }
  get lastLoginAt(): Date | null {
    return this.props.lastLoginAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
