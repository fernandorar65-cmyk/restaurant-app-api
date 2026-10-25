import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Customer } from '../../../../domain/entities/customer.entity.js';

export class CustomerResponseDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty({ example: 'Ana Torres' })
  name: string;

  @ApiProperty({ example: 'ana@mail.com' })
  email: string;

  @ApiPropertyOptional({ example: '+51999999999', nullable: true })
  phone: string | null;

  @ApiProperty({ example: false })
  marketingOptIn: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(customer: Customer): CustomerResponseDto {
    const dto = new CustomerResponseDto();
    dto.id = customer.id;
    dto.name = customer.name;
    dto.email = customer.email;
    dto.phone = customer.phone;
    dto.marketingOptIn = customer.marketingOptIn;
    dto.createdAt = customer.createdAt;
    dto.updatedAt = customer.updatedAt;
    return dto;
  }
}
