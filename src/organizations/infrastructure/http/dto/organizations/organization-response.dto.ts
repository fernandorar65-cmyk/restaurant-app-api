import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Organization } from '../../../../domain/entities/organization.entity.js';

export class OrganizationResponseDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  id: string;

  @ApiProperty({ example: 'Grupo Sabores S.A.' })
  name: string;

  @ApiPropertyOptional({ example: 'contacto@gruposabores.com' })
  email: string | null;

  @ApiPropertyOptional({ example: '+52 55 1234 5678' })
  phone: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(organization: Organization): OrganizationResponseDto {
    const dto = new OrganizationResponseDto();
    dto.id = organization.id;
    dto.name = organization.name;
    dto.email = organization.email;
    dto.phone = organization.phone;
    dto.createdAt = organization.createdAt;
    dto.updatedAt = organization.updatedAt;
    return dto;
  }
}
