import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Carlos Ruiz', minLength: 2 })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'carlos@restaurant.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'waiter' })
  @IsString()
  position: string;

  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  restaurantId: string;
}
