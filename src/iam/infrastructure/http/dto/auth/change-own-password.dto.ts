import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangeOwnPasswordDto {
  @ApiProperty({ example: 'current-password' })
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @ApiProperty({ example: 'N3w-password', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
