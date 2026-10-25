import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ example: '<refresh token>' })
  @IsString()
  @MinLength(1)
  refreshToken: string;
}
