import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Restaurant } from '../../restaurants/entities/restaurant.entity.js';

@Entity('organizations')
@Unique(['name'])
export class Organization extends BaseEntity {
  @ApiProperty({ example: 'Grupo Sabores S.A.' })
  @Column()
  name: string;

  @ApiPropertyOptional({ example: 'contacto@gruposabores.com' })
  @Column({ nullable: true })
  email?: string;

  @ApiPropertyOptional({ example: '+52 55 1234 5678' })
  @Column({ nullable: true })
  phone?: string;

  @OneToMany(() => Restaurant, (restaurant) => restaurant.organization)
  restaurants?: Restaurant[];
}
