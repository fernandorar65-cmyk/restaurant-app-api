import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { MenuStatus } from '../../../../domain/enums/menu-status.enum.js';
import { CreateMenuDto } from './create-menu.dto.js';

export class UpdateMenuDto extends PartialType(
  OmitType(CreateMenuDto, ['restaurantId'] as const),
) {
  @ApiPropertyOptional({ enum: MenuStatus })
  @IsOptional()
  @IsEnum(MenuStatus)
  status?: MenuStatus;
}
