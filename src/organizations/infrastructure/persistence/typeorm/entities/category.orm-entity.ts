import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { MenuOrmEntity } from './menu.orm-entity.js';
import { ProductOrmEntity } from './product.orm-entity.js';

@Entity('categories')
export class CategoryOrmEntity extends BaseOrmEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'menu_id' })
  menuId: string;

  @ManyToOne('MenuOrmEntity', (menu: MenuOrmEntity) => menu.categories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'menu_id' })
  menu?: MenuOrmEntity;

  @OneToMany(() => ProductOrmEntity, (product) => product.category)
  products?: ProductOrmEntity[];
}
