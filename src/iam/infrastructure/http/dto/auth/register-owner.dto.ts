import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type { OwnerRegistration } from '../../../../application/owner-registration/owner-registration.service.js';
import { AuthResponseDto } from './auth-response.dto.js';

export class OwnerOrganizationDto {
  @ApiProperty({ example: 'Grupo Sabores' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'Grupo Sabores S.A.C.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalName?: string | null;

  @ApiPropertyOptional({ example: '20601234567' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxIdentifier?: string | null;

  @ApiPropertyOptional({ example: 'PEN', default: 'PEN' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;

  @ApiPropertyOptional({ example: 'America/Lima', default: 'America/Lima' })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class OwnerRestaurantDto {
  @ApiProperty({ example: 'Sabores Miraflores' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'Av. Larco 123, Miraflores' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string | null;
}

export class RegisterOwnerDto {
  @ApiProperty({ example: 'duena@sabores.pe' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'S3cret-password', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Lucía' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiPropertyOptional({ example: 'Ramos' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiProperty({ type: OwnerOrganizationDto })
  @ValidateNested()
  @Type(() => OwnerOrganizationDto)
  organization: OwnerOrganizationDto;

  @ApiPropertyOptional({
    type: OwnerRestaurantDto,
    description: 'Primera sede, si el onboarding ya la pide',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OwnerRestaurantDto)
  restaurant?: OwnerRestaurantDto;
}

class RegisteredOrganizationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

class RegisteredRestaurantDto extends RegisteredOrganizationDto {
  @ApiProperty()
  slug: string;
}

export class OwnerRegistrationResponseDto extends AuthResponseDto {
  @ApiProperty({ type: RegisteredOrganizationDto })
  organization: RegisteredOrganizationDto;

  @ApiPropertyOptional({ type: RegisteredRestaurantDto, nullable: true })
  restaurant: RegisteredRestaurantDto | null;

  @ApiProperty({ description: 'Rol OWNER creado para la organización' })
  roleId: string;

  @ApiProperty()
  membershipId: string;

  @ApiProperty({ description: 'Permisos asignados al rol OWNER' })
  permissionCount: number;

  static fromRegistration(
    registration: OwnerRegistration,
  ): OwnerRegistrationResponseDto {
    const dto = Object.assign(
      new OwnerRegistrationResponseDto(),
      AuthResponseDto.fromDomain(registration.user, registration.tokens),
    );
    dto.organization = registration.organization;
    dto.restaurant = registration.restaurant;
    dto.roleId = registration.roleId;
    dto.membershipId = registration.membershipId;
    dto.permissionCount = registration.permissionCount;
    return dto;
  }
}
