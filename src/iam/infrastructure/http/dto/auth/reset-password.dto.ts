import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class StaffResetPasswordDto {
  @ApiProperty({ example: '<token from the email>' })
  @IsString()
  @MinLength(1)
  token: string;

  @ApiProperty({ example: 'N3w-password', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
