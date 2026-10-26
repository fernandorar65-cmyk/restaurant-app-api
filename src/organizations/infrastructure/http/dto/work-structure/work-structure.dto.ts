import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { JobPosition } from '../../../../domain/entities/job-position.entity.js';
import { WorkArea } from '../../../../domain/entities/work-area.entity.js';

export class CreateWorkAreaDto {
  @ApiProperty({ example: '424590bf-8d98-41c3-8ab9-e50440292401' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ example: 'Cocina', description: 'Único por organización (sin distinguir mayúsculas)' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}

export class UpdateWorkAreaDto extends PartialType(
  OmitType(CreateWorkAreaDto, ['organizationId'] as const),
) {
  @ApiPropertyOptional({ description: 'false = desactivar, true = reactivar' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class WorkAreaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty({ example: 'Cocina' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(workArea: WorkArea): WorkAreaResponseDto {
    const dto = new WorkAreaResponseDto();
    dto.id = workArea.id;
    dto.organizationId = workArea.organizationId;
    dto.name = workArea.name;
    dto.description = workArea.description;
    dto.isActive = workArea.isActive;
    dto.createdAt = workArea.createdAt;
    dto.updatedAt = workArea.updatedAt;
    return dto;
  }
}

export class CreateJobPositionDto {
  @ApiProperty({
    example: '424590bf-8d98-41c3-8ab9-e50440292401',
    description: 'Área del puesto; la organización se toma del área',
  })
  @IsUUID()
  workAreaId: string;

  @ApiProperty({ example: 'Cocinero', description: 'Único por área (sin distinguir mayúsculas)' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}

export class UpdateJobPositionDto extends PartialType(CreateJobPositionDto) {
  @ApiPropertyOptional({ description: 'false = desactivar, true = reactivar' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class JobPositionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  workAreaId: string;

  @ApiProperty({ example: 'Cocinero' })
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(jobPosition: JobPosition): JobPositionResponseDto {
    const dto = new JobPositionResponseDto();
    dto.id = jobPosition.id;
    dto.organizationId = jobPosition.organizationId;
    dto.workAreaId = jobPosition.workAreaId;
    dto.name = jobPosition.name;
    dto.description = jobPosition.description;
    dto.isActive = jobPosition.isActive;
    dto.createdAt = jobPosition.createdAt;
    dto.updatedAt = jobPosition.updatedAt;
    return dto;
  }
}
