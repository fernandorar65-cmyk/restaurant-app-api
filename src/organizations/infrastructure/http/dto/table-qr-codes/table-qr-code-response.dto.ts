import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableQrCode } from '../../../../domain/entities/table-qr-code.entity.js';

export class TableQrCodeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  diningTableId: string;

  @ApiProperty({ example: 2 })
  version: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  generatedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  revokedAt: Date | null;

  @ApiPropertyOptional({
    description:
      'Token a imprimir en el QR. Solo viene al generarlo; no se guarda en texto plano',
  })
  token?: string;

  static fromDomain(qrCode: TableQrCode, token?: string): TableQrCodeResponseDto {
    const dto = new TableQrCodeResponseDto();
    dto.id = qrCode.id;
    dto.diningTableId = qrCode.diningTableId;
    dto.version = qrCode.version;
    dto.isActive = qrCode.isActive;
    dto.generatedAt = qrCode.generatedAt;
    dto.revokedAt = qrCode.revokedAt;
    dto.token = token;
    return dto;
  }
}
