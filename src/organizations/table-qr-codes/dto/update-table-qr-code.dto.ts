import { PartialType } from '@nestjs/swagger';
import { CreateTableQrCodeDto } from './create-table-qr-code.dto.js';

export class UpdateTableQrCodeDto extends PartialType(CreateTableQrCodeDto) {}
