import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class StaffLoginDto {
  @ApiProperty({ example: 'ana@restaurant.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'S3cret-password' })
  @IsString()
  @MinLength(1)
  password: string;
}
