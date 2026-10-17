import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MenuItem {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty({ example: 'Ceviche' })
  name: string;

  @ApiPropertyOptional({ example: 'Fresh fish ceviche' })
  description?: string;

  @ApiProperty({ example: 12.5 })
  price: number;

  @ApiProperty({ example: true })
  available: boolean;
}
