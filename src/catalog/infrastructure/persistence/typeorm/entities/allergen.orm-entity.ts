import { Column, Entity, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';

@Entity('allergens')
@Unique('uq_allergens_code', ['code'])
export class AllergenOrmEntity extends BaseOrmEntity {
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;
}
