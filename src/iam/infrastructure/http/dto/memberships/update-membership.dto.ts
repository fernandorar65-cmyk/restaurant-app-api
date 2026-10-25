import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { MembershipStatus } from '../../../../domain/enums/membership-status.enum.js';
import { CreateMembershipDto } from './create-membership.dto.js';

export class UpdateMembershipDto extends PartialType(
  PickType(CreateMembershipDto, [
    'roleId',
    'allRestaurants',
    'restaurantIds',
  ] as const),
) {
  @ApiPropertyOptional({ enum: MembershipStatus })
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;
}
