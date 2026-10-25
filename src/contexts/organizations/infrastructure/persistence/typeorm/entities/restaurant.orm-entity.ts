import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../../../../../../common/persistence/base.orm-entity.js';
import { DiningTableOrmEntity } from './dining-table.orm-entity.js';
import { EmployeeOrmEntity } from './employee.orm-entity.js';
import { KitchenSupplyOrmEntity } from './kitchen-supply.orm-entity.js';
import { MenuOrmEntity } from './menu.orm-entity.js';
import type { OrganizationOrmEntity } from './organization.orm-entity.js';

@Entity('restaurants')
export class RestaurantOrmEntity extends BaseOrmEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(
    'OrganizationOrmEntity',
    (organization: OrganizationOrmEntity) => organization.restaurants,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'organization_id' })
  organization?: OrganizationOrmEntity;

  @OneToMany(() => DiningTableOrmEntity, (diningTable) => diningTable.restaurant)
  diningTables?: DiningTableOrmEntity[];

  @OneToMany(() => EmployeeOrmEntity, (employee) => employee.restaurant)
  employees?: EmployeeOrmEntity[];

  @OneToMany(() => MenuOrmEntity, (menu) => menu.restaurant)
  menus?: MenuOrmEntity[];

  @OneToMany(
    () => KitchenSupplyOrmEntity,
    (kitchenSupply) => kitchenSupply.restaurant,
  )
  kitchenSupplies?: KitchenSupplyOrmEntity[];
}
