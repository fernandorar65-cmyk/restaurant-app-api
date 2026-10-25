import { MembershipStatus } from '../enums/membership-status.enum.js';

export interface OrganizationMembershipProps {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  allRestaurants: boolean;
  /** Explicit restaurant scope; only meaningful when allRestaurants is false. */
  restaurantIds: string[];
  status: MembershipStatus;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Links a user to an organization with a role and a restaurant scope. Being
 * the OWNER of an organization is just a membership with the OWNER role.
 */
export class OrganizationMembership {
  private constructor(private props: OrganizationMembershipProps) {}

  static create(params: {
    id: string;
    organizationId: string;
    userId: string;
    roleId: string;
    allRestaurants?: boolean;
    restaurantIds?: string[];
  }): OrganizationMembership {
    const now = new Date();
    const membership = new OrganizationMembership({
      id: params.id,
      organizationId: params.organizationId,
      userId: params.userId,
      roleId: params.roleId,
      allRestaurants: false,
      restaurantIds: [],
      status: MembershipStatus.ACTIVE,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    membership.changeScope(
      params.allRestaurants ?? false,
      params.restaurantIds ?? [],
    );
    return membership;
  }

  static fromPersistence(props: OrganizationMembershipProps): OrganizationMembership {
    return new OrganizationMembership(props);
  }

  changeRole(roleId: string): void {
    this.props.roleId = roleId;
    this.touch();
  }

  /**
   * An empty list with allRestaurants=false means no restaurant access; it
   * is never read as "all restaurants".
   */
  changeScope(allRestaurants: boolean, restaurantIds: string[]): void {
    this.props.allRestaurants = allRestaurants;
    this.props.restaurantIds = allRestaurants ? [] : [...new Set(restaurantIds)];
    this.touch();
  }

  changeStatus(status: MembershipStatus): void {
    this.props.status = status;
    this.touch();
  }

  canAccessRestaurant(restaurantId: string): boolean {
    if (this.props.status !== MembershipStatus.ACTIVE) {
      return false;
    }
    return (
      this.props.allRestaurants || this.props.restaurantIds.includes(restaurantId)
    );
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get userId(): string {
    return this.props.userId;
  }
  get roleId(): string {
    return this.props.roleId;
  }
  get allRestaurants(): boolean {
    return this.props.allRestaurants;
  }
  get restaurantIds(): string[] {
    return [...this.props.restaurantIds];
  }
  get status(): MembershipStatus {
    return this.props.status;
  }
  get joinedAt(): Date {
    return this.props.joinedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
