import { Check, Column, Entity, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import { inValues } from '../../../../../common/persistence/column-options.js';
import { OrganizationStatus } from '../../../../domain/enums/organization-status.enum.js';

@Entity('organizations')
@Unique('uq_organizations_tax_identifier', ['taxIdentifier'])
@Check(
  'chk_organizations_status',
  inValues('status', Object.values(OrganizationStatus)),
)
export class OrganizationOrmEntity extends BaseOrmEntity {
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 200, nullable: true })
  legalName: string | null;

  @Column({
    name: 'tax_identifier',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  taxIdentifier: string | null;

  @Column({ name: 'currency_code', type: 'char', length: 3, default: 'PEN' })
  currencyCode: string;

  @Column({ type: 'varchar', length: 80, default: 'America/Lima' })
  timezone: string;

  @Column({ type: 'varchar', length: 20, default: OrganizationStatus.ACTIVE })
  status: OrganizationStatus;
}
