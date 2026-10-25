import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class StaffRefreshDto {
  @ApiProperty({ example: '<refresh token>' })
  @IsString()
  @MinLength(1)
  refreshToken: string;
}
