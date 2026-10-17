import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty({ example: 'Ana Pérez' })
  name: string;

  @ApiProperty({ example: 'ana@example.com' })
  email: string;
}
