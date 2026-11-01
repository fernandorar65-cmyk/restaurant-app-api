import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Access control catalog (evaluation A1, pending #9):
 * - the 20 permissions (`<area>.read` / `<area>.manage`);
 * - the base roles (OWNER, ADMIN, CASHIER, WAITER, KITCHEN) for every
 *   organization that doesn't have them yet, with their permissions.
 *
 * A snapshot on purpose: later catalog changes go in their own migration.
 * New organizations get their roles from the application (OrganizationCreated).
 * Idempotent: existing permissions, roles and grants are left as they are.
 */
export class AccessCatalog1761955400000 implements MigrationInterface {
  name = 'AccessCatalog1761955400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO permissions (code, name)
      VALUES
          ('organizations.read', 'Ver la organización'),
          ('organizations.manage', 'Gestionar la organización'),
          ('restaurants.read', 'Ver las sedes, salones y mesas'),
          ('restaurants.manage', 'Gestionar las sedes, salones y mesas'),
          ('staff.read', 'Ver el personal (empleados, roles y membresías)'),
          ('staff.manage', 'Gestionar el personal (empleados, roles y membresías)'),
          ('settings.read', 'Ver los estados y tipos de servicio'),
          ('settings.manage', 'Gestionar los estados y tipos de servicio'),
          ('catalog.read', 'Ver el catálogo y los menús'),
          ('catalog.manage', 'Gestionar el catálogo y los menús'),
          ('attentions.read', 'Ver las atenciones y órdenes'),
          ('attentions.manage', 'Gestionar las atenciones y órdenes'),
          ('kitchen.read', 'Ver el estado de los platos'),
          ('kitchen.manage', 'Gestionar el estado de los platos'),
          ('payments.read', 'Ver los pagos'),
          ('payments.manage', 'Gestionar los pagos'),
          ('inventory.read', 'Ver el inventario'),
          ('inventory.manage', 'Gestionar el inventario'),
          ('finance.read', 'Ver los gastos y cierres diarios'),
          ('finance.manage', 'Gestionar los gastos y cierres diarios')
      ON CONFLICT (code) DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO roles (organization_id, code, name, description, is_system)
      SELECT o.id, base.code, base.name, base.description, true
        FROM organizations o
       CROSS JOIN (VALUES
          ('OWNER', 'Propietario', 'Acceso total a la organización'),
          ('ADMIN', 'Administrador', 'Todo excepto los datos de la organización'),
          ('CASHIER', 'Caja', 'Atenciones y cobros'),
          ('WAITER', 'Mozo', 'Atenciones, órdenes y estado de los platos'),
          ('KITCHEN', 'Cocina', 'Estado de los platos')
       ) AS base (code, name, description)
      ON CONFLICT (organization_id, code) DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
        FROM (VALUES
          ('OWNER', 'organizations.read'),
          ('OWNER', 'organizations.manage'),
          ('OWNER', 'restaurants.read'),
          ('OWNER', 'restaurants.manage'),
          ('OWNER', 'staff.read'),
          ('OWNER', 'staff.manage'),
          ('OWNER', 'settings.read'),
          ('OWNER', 'settings.manage'),
          ('OWNER', 'catalog.read'),
          ('OWNER', 'catalog.manage'),
          ('OWNER', 'attentions.read'),
          ('OWNER', 'attentions.manage'),
          ('OWNER', 'kitchen.read'),
          ('OWNER', 'kitchen.manage'),
          ('OWNER', 'payments.read'),
          ('OWNER', 'payments.manage'),
          ('OWNER', 'inventory.read'),
          ('OWNER', 'inventory.manage'),
          ('OWNER', 'finance.read'),
          ('OWNER', 'finance.manage'),
          ('ADMIN', 'organizations.read'),
          ('ADMIN', 'restaurants.read'),
          ('ADMIN', 'restaurants.manage'),
          ('ADMIN', 'staff.read'),
          ('ADMIN', 'staff.manage'),
          ('ADMIN', 'settings.read'),
          ('ADMIN', 'settings.manage'),
          ('ADMIN', 'catalog.read'),
          ('ADMIN', 'catalog.manage'),
          ('ADMIN', 'attentions.read'),
          ('ADMIN', 'attentions.manage'),
          ('ADMIN', 'kitchen.read'),
          ('ADMIN', 'kitchen.manage'),
          ('ADMIN', 'payments.read'),
          ('ADMIN', 'payments.manage'),
          ('ADMIN', 'inventory.read'),
          ('ADMIN', 'inventory.manage'),
          ('ADMIN', 'finance.read'),
          ('ADMIN', 'finance.manage'),
          ('CASHIER', 'attentions.read'),
          ('CASHIER', 'attentions.manage'),
          ('CASHIER', 'payments.read'),
          ('CASHIER', 'payments.manage'),
          ('CASHIER', 'kitchen.read'),
          ('WAITER', 'attentions.read'),
          ('WAITER', 'attentions.manage'),
          ('WAITER', 'kitchen.read'),
          ('WAITER', 'kitchen.manage'),
          ('WAITER', 'catalog.read'),
          ('KITCHEN', 'kitchen.read'),
          ('KITCHEN', 'kitchen.manage'),
          ('KITCHEN', 'catalog.read'),
          ('KITCHEN', 'inventory.read')
        ) AS grants (role_code, permission_code)
        JOIN roles r ON r.code = grants.role_code AND r.is_system
        JOIN permissions p ON p.code = grants.permission_code
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // OWNER predates this migration (owner sign-up), so it is kept.
    await queryRunner.query(`
      DELETE FROM roles r
       WHERE r.is_system
         AND r.code IN ('ADMIN', 'CASHIER', 'WAITER', 'KITCHEN')
         AND NOT EXISTS (
           SELECT 1 FROM organization_memberships m WHERE m.role_id = r.id
         )
    `);
  }
}
