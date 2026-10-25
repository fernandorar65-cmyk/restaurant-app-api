import { PartialType } from '@nestjs/swagger';
import { CreateKitchenSupplyDto } from './create-kitchen-supply.dto.js';

export class UpdateKitchenSupplyDto extends PartialType(
  CreateKitchenSupplyDto,
) {}
