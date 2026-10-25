import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Organization } from '../../../../domain/entities/organization.entity.js';
import { OrganizationStatus } from '../../../../domain/enums/organization-status.enum.js';

export class OrganizationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Grupo Sabores' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  legalName: string | null;

  @ApiPropertyOptional({ nullable: true })
  taxIdentifier: string | null;

  @ApiProperty({ example: 'PEN' })
  currencyCode: string;

  @ApiProperty({ example: 'America/Lima' })
  timezone: string;

  @ApiProperty({ enum: OrganizationStatus })
  status: OrganizationStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(organization: Organization): OrganizationResponseDto {
    const dto = new OrganizationResponseDto();
    dto.id = organization.id;
    dto.name = organization.name;
    dto.legalName = organization.legalName;
    dto.taxIdentifier = organization.taxIdentifier;
    dto.currencyCode = organization.currencyCode;
    dto.timezone = organization.timezone;
    dto.status = organization.status;
    dto.createdAt = organization.createdAt;
    dto.updatedAt = organization.updatedAt;
    return dto;
  }
}
