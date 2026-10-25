import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserLookupPort } from '../../application/ports/user-lookup.port.js';

/**
 * IAM already depends on organizations (roles and memberships belong to an
 * organization), so going through IAM's services from here would create a
 * module cycle. Both contexts share the database today, so this adapter
 * checks the users table directly; if IAM is ever split out, only this file
 * changes (e.g. to an HTTP client).
 */
@Injectable()
export class SqlUserLookupAdapter implements UserLookupPort {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async exists(userId: string): Promise<boolean> {
    const rows: unknown[] = await this.dataSource.query(
      'SELECT 1 FROM users WHERE id = $1',
      [userId],
    );
    return rows.length > 0;
  }
}
