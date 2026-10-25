import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class StaffForgotPasswordDto {
  @ApiProperty({ example: 'ana@restaurant.com' })
  @IsEmail()
  email: string;
}
