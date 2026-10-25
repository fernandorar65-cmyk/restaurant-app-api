import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { UpdateMeDto } from '../auth/update-me.dto.js';

export class UpdateCustomerMeDto extends UpdateMeDto {
  @ApiPropertyOptional({ example: 'Vegetariana, sin maní' })
  @IsOptional()
  @IsString()
  dietaryPreferences?: string | null;
}
