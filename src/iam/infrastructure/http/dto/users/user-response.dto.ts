import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../../../domain/entities/user.entity.js';
import { UserStatus } from '../../../../domain/enums/user-status.enum.js';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'ana@restaurant.com' })
  email: string;

  @ApiProperty({ example: 'Ana' })
  firstName: string;

  @ApiPropertyOptional({ nullable: true, example: 'Pérez' })
  lastName: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone: string | null;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty()
  mustChangePassword: boolean;

  @ApiPropertyOptional({ nullable: true })
  lastLoginAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.phone = user.phone;
    dto.status = user.status;
    dto.mustChangePassword = user.mustChangePassword;
    dto.lastLoginAt = user.lastLoginAt;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
