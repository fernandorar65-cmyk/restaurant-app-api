import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl, MaxLength } from 'class-validator';
import { DiningTableResponseDto } from './dining-table-response.dto.js';

export class GenerateQrDto {
  @ApiPropertyOptional({
    example: 'https://storage.example.com/qr/mesa-1.png',
    description:
      'Ubicación de la imagen si se guarda en almacenamiento externo. Si se genera bajo demanda, omitir',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(1000)
  assetUrl?: string | null;
}

export class GeneratedQrResponseDto {
  @ApiProperty({ type: DiningTableResponseDto })
  table: DiningTableResponseDto;

  @ApiProperty({
    description:
      'Token del QR. Solo se devuelve aquí: en la base queda únicamente su SHA-256',
  })
  token: string;

  @ApiProperty({
    example: 'https://app.acmr.pe/t/<token>',
    description: 'URL a codificar en la imagen del QR',
  })
  qrUrl: string;
}
