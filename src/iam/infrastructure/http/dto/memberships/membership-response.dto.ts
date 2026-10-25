import { ApiProperty } from '@nestjs/swagger';
import { OrganizationMembership } from '../../../../domain/entities/organization-membership.entity.js';
import { MembershipStatus } from '../../../../domain/enums/membership-status.enum.js';

export class MembershipResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  roleId: string;

  @ApiProperty()
  allRestaurants: boolean;

  @ApiProperty({ type: [String] })
  restaurantIds: string[];

  @ApiProperty({ enum: MembershipStatus })
  status: MembershipStatus;

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(membership: OrganizationMembership): MembershipResponseDto {
    const dto = new MembershipResponseDto();
    dto.id = membership.id;
    dto.organizationId = membership.organizationId;
    dto.userId = membership.userId;
    dto.roleId = membership.roleId;
    dto.allRestaurants = membership.allRestaurants;
    dto.restaurantIds = membership.restaurantIds;
    dto.status = membership.status;
    dto.joinedAt = membership.joinedAt;
    dto.createdAt = membership.createdAt;
    dto.updatedAt = membership.updatedAt;
    return dto;
  }
}
