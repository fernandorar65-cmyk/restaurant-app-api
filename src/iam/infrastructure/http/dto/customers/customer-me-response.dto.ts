import { ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerProfile } from '../../../../domain/entities/customer-profile.entity.js';
import { User } from '../../../../domain/entities/user.entity.js';
import { UserResponseDto } from '../users/user-response.dto.js';

export class CustomerMeResponseDto extends UserResponseDto {
  @ApiPropertyOptional({ nullable: true })
  dietaryPreferences: string | null;

  static fromProfile(user: User, profile: CustomerProfile): CustomerMeResponseDto {
    const dto = Object.assign(
      new CustomerMeResponseDto(),
      UserResponseDto.fromDomain(user),
    );
    dto.dietaryPreferences = profile.dietaryPreferences;
    return dto;
  }
}
