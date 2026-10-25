import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Employee } from '../../../../domain/entities/employee.entity.js';

export class EmployeeResponseDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty({ example: 'Carlos Ruiz' })
  name: string;

  @ApiPropertyOptional({ example: 'carlos@restaurant.com' })
  email: string | null;

  @ApiProperty({ example: 'waiter' })
  position: string;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(employee: Employee): EmployeeResponseDto {
    const dto = new EmployeeResponseDto();
    dto.id = employee.id;
    dto.name = employee.name;
    dto.email = employee.email;
    dto.position = employee.position;
    dto.restaurantId = employee.restaurantId;
    dto.createdAt = employee.createdAt;
    dto.updatedAt = employee.updatedAt;
    return dto;
  }
}
