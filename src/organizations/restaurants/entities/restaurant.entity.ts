import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { DiningTable } from '../../dining-tables/entities/dining-table.entity.js';
import { Employee } from '../../employees/entities/employee.entity.js';
import { KitchenSupply } from '../../kitchen-supplies/entities/kitchen-supply.entity.js';
import { Menu } from '../../menus/entities/menu.entity.js';
import type { Organization } from '../../organizations/entities/organization.entity.js';

@Entity('restaurants')
export class Restaurant extends BaseEntity {
  @ApiProperty({ example: 'Restaurante Centro' })
  @Column()
  name: string;

  @ApiPropertyOptional({ example: 'Av. Reforma 123, CDMX' })
  @Column({ nullable: true })
  address?: string;

  @ApiPropertyOptional({ example: '+52 55 8765 4321' })
  @Column({ nullable: true })
  phone?: string;

  @ApiProperty()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne('Organization', (organization: Organization) => organization.restaurants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @OneToMany(() => DiningTable, (diningTable) => diningTable.restaurant)
  diningTables?: DiningTable[];

  @OneToMany(() => Employee, (employee) => employee.restaurant)
  employees?: Employee[];

  @OneToMany(() => Menu, (menu) => menu.restaurant)
  menus?: Menu[];

  @OneToMany(() => KitchenSupply, (kitchenSupply) => kitchenSupply.restaurant)
  kitchenSupplies?: KitchenSupply[];
}
