import { PartialType } from '@nestjs/swagger';
import { CreateDiningTableDto } from './create-dining-table.dto.js';

export class UpdateDiningTableDto extends PartialType(CreateDiningTableDto) {}
