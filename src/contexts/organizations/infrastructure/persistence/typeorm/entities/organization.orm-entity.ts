import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../../common/persistence/base.orm-entity.js';
import { RestaurantOrmEntity } from './restaurant.orm-entity.js';

@Entity('organizations')
@Unique(['name'])
export class OrganizationOrmEntity extends BaseOrmEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @OneToMany(() => RestaurantOrmEntity, (restaurant) => restaurant.organization)
  restaurants?: RestaurantOrmEntity[];
}
