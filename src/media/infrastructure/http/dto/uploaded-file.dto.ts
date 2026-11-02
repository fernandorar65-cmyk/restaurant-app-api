import { ApiProperty } from '@nestjs/swagger';
import type { StoredFile } from '../../../application/ports/file-storage.port.js';

export class UploadedFileResponseDto {
  @ApiProperty({ example: 'restaurants/1f0c.../images/9a7b....webp' })
  key: string;

  @ApiProperty({
    example: 'https://cdn.acmr.pe/restaurants/1f0c.../images/9a7b....webp',
    description:
      'URL pública para guardar en el registro (p. ej. imageUrl del producto)',
  })
  url: string;

  static from(file: StoredFile): UploadedFileResponseDto {
    return Object.assign(new UploadedFileResponseDto(), file);
  }
}
