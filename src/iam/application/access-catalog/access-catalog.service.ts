import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { TransactionContext } from '../../../common/domain/transaction-context.js';
import { BASE_ROLES, PERMISSION_DEFINITIONS } from '../../domain/access-catalog.js';
import { Permission } from '../../domain/entities/permission.entity.js';
import { RolePermission } from '../../domain/entities/role-permission.entity.js';
import { Role } from '../../domain/entities/role.entity.js';
import { PERMISSION_REPOSITORY } from '../../domain/repositories/permission.repository.js';
import type { PermissionRepository } from '../../domain/repositories/permission.repository.js';
import { ROLE_PERMISSION_REPOSITORY } from '../../domain/repositories/role-permission.repository.js';
import type { RolePermissionRepository } from '../../domain/repositories/role-permission.repository.js';
import { ROLE_REPOSITORY } from '../../domain/repositories/role.repository.js';
import type { RoleRepository } from '../../domain/repositories/role.repository.js';

/**
 * Keeps the permission catalog in the database and gives every new
 * organization its base roles (OWNER, ADMIN, CASHIER, WAITER, KITCHEN).
 */
@Injectable()
export class AccessCatalogService implements OnApplicationBootstrap {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    @Inject(ROLE_PERMISSION_REPOSITORY)
    private readonly rolePermissionRepository: RolePermissionRepository,
  ) {}

  /** Idempotent: only the missing permission codes are inserted. */
  async onApplicationBootstrap(): Promise<void> {
    for (const definition of PERMISSION_DEFINITIONS) {
      if (!(await this.permissionRepository.findByCode(definition.code))) {
        await this.permissionRepository.save(
          Permission.create({ id: randomUUID(), ...definition }),
        );
      }
    }
  }

  /**
   * Creates the base roles the organization doesn't have yet, with their
   * permissions. Runs in the transaction that created the organization.
   */
  async provisionBaseRoles(
    organizationId: string,
    tx?: TransactionContext,
  ): Promise<void> {
    const permissionIds = new Map(
      (await this.permissionRepository.findActive()).map((permission) => [
        permission.code,
        permission.id,
      ]),
    );
    for (const definition of BASE_ROLES) {
      if (
        await this.roleRepository.findByCode(organizationId, definition.code, tx)
      ) {
        continue;
      }
      const role = await this.roleRepository.save(
        Role.create({
          id: randomUUID(),
          organizationId,
          code: definition.code,
          name: definition.name,
          description: definition.description,
          isSystem: true,
        }),
        tx,
      );
      for (const code of definition.permissions) {
        const permissionId = permissionIds.get(code);
        if (permissionId) {
          await this.rolePermissionRepository.save(
            RolePermission.create({ roleId: role.id, permissionId }),
            tx,
          );
        }
      }
    }
  }
}
