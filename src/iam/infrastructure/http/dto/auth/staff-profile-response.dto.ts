import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { StaffEmployment } from '../../../../application/ports/staff-directory.port.js';
import type {
  StaffAccess,
  StaffProfile,
} from '../../../../application/staff-profile/staff-profile.service.js';
import { UserResponseDto } from '../users/user-response.dto.js';

class NamedRefDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

class RoleRefDto extends NamedRefDto {
  @ApiProperty({ example: 'CASHIER' })
  code: string;
}

export class StaffAccessResponseDto {
  @ApiProperty()
  membershipId: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  organizationName: string;

  @ApiProperty({ type: RoleRefDto })
  role: RoleRefDto;

  @ApiProperty({ description: 'true = todas las sedes de la organización' })
  allRestaurants: boolean;

  @ApiProperty({
    type: [String],
    description: 'Sedes permitidas si allRestaurants es false',
  })
  restaurantIds: string[];

  @ApiProperty({
    type: [String],
    example: ['attentions.manage', 'payments.read'],
  })
  permissions: string[];

  static from(access: StaffAccess): StaffAccessResponseDto {
    return Object.assign(new StaffAccessResponseDto(), access);
  }
}

export class StaffEmploymentResponseDto {
  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  organizationName: string;

  @ApiProperty()
  employeeCode: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-01-15' })
  hiredAt: string | null;

  @ApiPropertyOptional({ type: NamedRefDto, nullable: true })
  jobPosition: NamedRefDto | null;

  @ApiPropertyOptional({ type: NamedRefDto, nullable: true })
  workArea: NamedRefDto | null;

  static from(employment: StaffEmployment): StaffEmploymentResponseDto {
    return Object.assign(new StaffEmploymentResponseDto(), employment);
  }
}

export class StaffProfileResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty()
  isPlatformAdmin: boolean;

  @ApiProperty({
    type: [StaffAccessResponseDto],
    description: 'Membresías activas: rol, sedes y permisos por organización',
  })
  access: StaffAccessResponseDto[];

  @ApiProperty({
    type: [StaffEmploymentResponseDto],
    description: 'Empleados vinculados al usuario (puesto y área)',
  })
  employments: StaffEmploymentResponseDto[];

  static from(profile: StaffProfile): StaffProfileResponseDto {
    const dto = new StaffProfileResponseDto();
    dto.user = UserResponseDto.fromDomain(profile.user);
    dto.isPlatformAdmin = profile.isPlatformAdmin;
    dto.access = profile.access.map((access) =>
      StaffAccessResponseDto.from(access),
    );
    dto.employments = profile.employments.map((employment) =>
      StaffEmploymentResponseDto.from(employment),
    );
    return dto;
  }
}
