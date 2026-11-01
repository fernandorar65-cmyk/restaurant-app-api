import {
  ACCESS_AREAS,
  PERMISSION_CODES,
  type AccessArea,
  type PermissionCode,
} from '../../common/domain/access.js';
import { OWNER_ROLE_CODE } from './owner-role.js';

const AREA_NAMES: Record<AccessArea, string> = {
  organizations: 'la organización',
  restaurants: 'las sedes, salones y mesas',
  staff: 'el personal (empleados, roles y membresías)',
  settings: 'los estados y tipos de servicio',
  catalog: 'el catálogo y los menús',
  attentions: 'las atenciones y órdenes',
  kitchen: 'el estado de los platos',
  payments: 'los pagos',
  inventory: 'el inventario',
  finance: 'los gastos y cierres diarios',
};

export interface PermissionDefinition {
  code: PermissionCode;
  name: string;
}

/** The platform-wide permission catalog, kept in the permissions table. */
export const PERMISSION_DEFINITIONS: PermissionDefinition[] =
  ACCESS_AREAS.flatMap((area) => [
    { code: `${area}.read` as PermissionCode, name: `Ver ${AREA_NAMES[area]}` },
    {
      code: `${area}.manage` as PermissionCode,
      name: `Gestionar ${AREA_NAMES[area]}`,
    },
  ]);

export interface BaseRoleDefinition {
  code: string;
  name: string;
  description: string;
  permissions: PermissionCode[];
}

const all = (...areas: AccessArea[]): PermissionCode[] =>
  areas.flatMap((area) => [`${area}.read`, `${area}.manage`] as PermissionCode[]);

/**
 * Roles every organization starts with. They are a starting point: each
 * organization can edit them or add its own. OWNER always holds every
 * permission, even ones added later.
 */
export const BASE_ROLES: BaseRoleDefinition[] = [
  {
    code: OWNER_ROLE_CODE,
    name: 'Propietario',
    description: 'Acceso total a la organización',
    permissions: PERMISSION_CODES,
  },
  {
    code: 'ADMIN',
    name: 'Administrador',
    description: 'Todo excepto los datos de la organización',
    permissions: PERMISSION_CODES.filter(
      (code) => code !== 'organizations.manage',
    ),
  },
  {
    code: 'CASHIER',
    name: 'Caja',
    description: 'Atenciones y cobros',
    permissions: [...all('attentions', 'payments'), 'kitchen.read'],
  },
  {
    code: 'WAITER',
    name: 'Mozo',
    description: 'Atenciones, órdenes y estado de los platos',
    permissions: [...all('attentions', 'kitchen'), 'catalog.read'],
  },
  {
    code: 'KITCHEN',
    name: 'Cocina',
    description: 'Estado de los platos',
    permissions: [...all('kitchen'), 'catalog.read', 'inventory.read'],
  },
];
