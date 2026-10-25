import { ApiProperty } from '@nestjs/swagger';
import { TableQrCode } from '../../../../domain/entities/table-qr-code.entity.js';

export class TableQrCodeResponseDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty({ example: 'https://app.restaurant.com/t/424590bf' })
  codeUrl: string;

  @ApiProperty()
  diningTableId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(tableQrCode: TableQrCode): TableQrCodeResponseDto {
    const dto = new TableQrCodeResponseDto();
    dto.id = tableQrCode.id;
    dto.codeUrl = tableQrCode.codeUrl;
    dto.diningTableId = tableQrCode.diningTableId;
    dto.createdAt = tableQrCode.createdAt;
    dto.updatedAt = tableQrCode.updatedAt;
    return dto;
  }
}
