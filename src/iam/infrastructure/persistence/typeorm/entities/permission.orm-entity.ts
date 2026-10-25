import { Column, Entity, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';

@Entity('permissions')
@Unique('uq_permissions_code', ['code'])
export class PermissionOrmEntity extends BaseOrmEntity {
  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
