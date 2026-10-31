import { Check, Column, Entity, Index } from 'typeorm';
import { CreatedOnlyOrmEntity } from '../../../../../common/persistence/base.orm-entity.js';
import { inValues } from '../../../../../common/persistence/column-options.js';

// No foreign keys on purpose: an error log must outlive (and never block the
// deletion of) the user it mentions, and it must be writable even when the
// data it refers to is the inconsistent part.
@Entity('error_logs')
@Check('chk_error_logs_level', inValues('level', ['error', 'fatal']))
@Index('idx_error_logs_created_at', ['createdAt'])
@Index('idx_error_logs_request_id', ['requestId'])
export class ErrorLogOrmEntity extends CreatedOnlyOrmEntity {
  @Column({ type: 'varchar', length: 10 })
  level: 'error' | 'fatal';

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  stack: string | null;

  @Column({ name: 'request_id', type: 'varchar', length: 64, nullable: true })
  requestId: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  method: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  path: string | null;

  @Column({ name: 'status_code', type: 'smallint', nullable: true })
  statusCode: number | null;

  @Column({ name: 'error_code', type: 'varchar', length: 100, nullable: true })
  errorCode: string | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;
}
