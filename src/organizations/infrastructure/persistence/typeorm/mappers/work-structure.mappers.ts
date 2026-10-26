import { JobPosition } from '../../../../domain/entities/job-position.entity.js';
import { WorkArea } from '../../../../domain/entities/work-area.entity.js';
import { JobPositionOrmEntity } from '../entities/job-position.orm-entity.js';
import { WorkAreaOrmEntity } from '../entities/work-area.orm-entity.js';

export class WorkAreaMapper {
  static toDomain(orm: WorkAreaOrmEntity): WorkArea {
    return WorkArea.fromPersistence({
      id: orm.id,
      organizationId: orm.organizationId,
      name: orm.name,
      description: orm.description,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: WorkArea, existing?: WorkAreaOrmEntity): WorkAreaOrmEntity {
    const orm = existing ?? new WorkAreaOrmEntity();
    orm.id = domain.id;
    orm.organizationId = domain.organizationId;
    orm.name = domain.name;
    orm.description = domain.description;
    orm.isActive = domain.isActive;
    return orm;
  }
}

export class JobPositionMapper {
  static toDomain(orm: JobPositionOrmEntity): JobPosition {
    return JobPosition.fromPersistence({
      id: orm.id,
      organizationId: orm.organizationId,
      workAreaId: orm.workAreaId,
      name: orm.name,
      description: orm.description,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(
    domain: JobPosition,
    existing?: JobPositionOrmEntity,
  ): JobPositionOrmEntity {
    const orm = existing ?? new JobPositionOrmEntity();
    orm.id = domain.id;
    orm.organizationId = domain.organizationId;
    orm.workAreaId = domain.workAreaId;
    orm.name = domain.name;
    orm.description = domain.description;
    orm.isActive = domain.isActive;
    return orm;
  }
}
