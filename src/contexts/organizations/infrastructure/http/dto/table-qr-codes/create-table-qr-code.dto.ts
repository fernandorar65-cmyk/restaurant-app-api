import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateTableQrCodeDto {
  @ApiProperty({ example: 'https://app.restaurant.com/t/424590bf' })
  @IsString()
  @MinLength(5)
  codeUrl: string;

  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  diningTableId: string;
}
