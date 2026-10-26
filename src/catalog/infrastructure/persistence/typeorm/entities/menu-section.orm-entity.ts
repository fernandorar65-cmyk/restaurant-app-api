import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import type { CategoryOrmEntity } from './category.orm-entity.js';
import type { MenuOrmEntity } from './menu.orm-entity.js';

@Entity('menu_sections')
@Unique('uq_menu_sections_menu_name', ['menuId', 'name'])
@Index('idx_menu_sections_menu_order', ['menuId', 'sortOrder'])
@Check('chk_menu_sections_name_length', 'char_length(name) BETWEEN 1 AND 100')
export class MenuSectionOrmEntity extends BaseOrmEntity {
  @Column({ name: 'menu_id', type: 'uuid' })
  menuId: string;

  @ManyToOne('MenuOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu?: MenuOrmEntity;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne('CategoryOrmEntity', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: CategoryOrmEntity;

  // citext: "Entradas" and "entradas" are the same section.
  @Column({ type: 'citext' })
  name: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
