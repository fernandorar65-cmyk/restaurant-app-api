import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterCustomerDto {
  @ApiProperty({ example: 'ana@mail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'S3cret-password', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Ana' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiPropertyOptional({ example: 'Torres' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string | null;

  @ApiPropertyOptional({ example: '+51 999 999 999' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiPropertyOptional({ example: 'Vegetariana, sin maní' })
  @IsOptional()
  @IsString()
  dietaryPreferences?: string | null;
}
