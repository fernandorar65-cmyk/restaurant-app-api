import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { Money } from '../../../common/domain/value-objects/money.js';
import { requireText } from '../../../common/domain/value-objects/required-text.js';
import { FulfillmentMode } from '../enums/fulfillment-mode.enum.js';
import { normalizeCode, requireSortOrder } from './workflow-status.entity.js';

export interface ServiceTypeProps {
  id: string;
  restaurantId: string;
  code: string;
  name: string;
  fulfillmentMode: FulfillmentMode;
  requiresTable: boolean;
  requiresCustomerAddress: boolean;
  minimumOrderAmount: number;
  deliveryFee: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceTypeSettings {
  code?: string;
  name?: string;
  requiresTable?: boolean;
  requiresCustomerAddress?: boolean;
  minimumOrderAmount?: number;
  deliveryFee?: number;
  sortOrder?: number;
}

/** What an attention keeps of its service type. */
export interface ServiceTypeRef {
  id: string;
  fulfillmentMode: FulfillmentMode;
  requiresTable: boolean;
}

/**
 * A way a restaurant serves (e.g. "En mesa", "Para llevar", "Delivery
 * propio"). Name, order, minimum and fee are the restaurant's; the backend
 * rules follow fulfillment_mode. Used types are deactivated, never deleted.
 */
export class ServiceType {
  private constructor(private props: ServiceTypeProps) {}

  static create(
    params: ServiceTypeSettings & {
      id: string;
      restaurantId: string;
      code: string;
      name: string;
      fulfillmentMode: FulfillmentMode;
      sortOrder: number;
    },
  ): ServiceType {
    const now = new Date();
    const serviceType = new ServiceType({
      id: params.id,
      restaurantId: params.restaurantId,
      code: normalizeCode(params.code),
      name: requireText(params.name, 'El nombre del tipo de servicio', {
        max: 100,
      }),
      fulfillmentMode: params.fulfillmentMode,
      requiresTable:
        params.requiresTable ??
        params.fulfillmentMode === FulfillmentMode.DINE_IN,
      requiresCustomerAddress:
        params.requiresCustomerAddress ??
        params.fulfillmentMode === FulfillmentMode.DELIVERY,
      minimumOrderAmount: requireAmount(
        params.minimumOrderAmount ?? 0,
        'El monto mínimo',
      ),
      deliveryFee: requireAmount(params.deliveryFee ?? 0, 'El costo de envío'),
      sortOrder: requireSortOrder(params.sortOrder),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    assertConsistent(serviceType.props);
    return serviceType;
  }

  static fromPersistence(props: ServiceTypeProps): ServiceType {
    return new ServiceType(props);
  }

  configure(settings: ServiceTypeSettings & { isActive?: boolean }): void {
    const next = { ...this.props };
    if (settings.code !== undefined) {
      next.code = normalizeCode(settings.code);
    }
    if (settings.name !== undefined) {
      next.name = requireText(settings.name, 'El nombre del tipo de servicio', {
        max: 100,
      });
    }
    if (settings.requiresTable !== undefined) {
      next.requiresTable = settings.requiresTable;
    }
    if (settings.requiresCustomerAddress !== undefined) {
      next.requiresCustomerAddress = settings.requiresCustomerAddress;
    }
    if (settings.minimumOrderAmount !== undefined) {
      next.minimumOrderAmount = requireAmount(
        settings.minimumOrderAmount,
        'El monto mínimo',
      );
    }
    if (settings.deliveryFee !== undefined) {
      next.deliveryFee = requireAmount(
        settings.deliveryFee,
        'El costo de envío',
      );
    }
    if (settings.sortOrder !== undefined) {
      next.sortOrder = requireSortOrder(settings.sortOrder);
    }
    if (settings.isActive !== undefined) {
      next.isActive = settings.isActive;
    }
    assertConsistent(next);
    next.updatedAt = new Date();
    this.props = next;
  }

  get ref(): ServiceTypeRef {
    return {
      id: this.props.id,
      fulfillmentMode: this.props.fulfillmentMode,
      requiresTable: this.props.requiresTable,
    };
  }

  get id(): string {
    return this.props.id;
  }
  get restaurantId(): string {
    return this.props.restaurantId;
  }
  get code(): string {
    return this.props.code;
  }
  get name(): string {
    return this.props.name;
  }
  get fulfillmentMode(): FulfillmentMode {
    return this.props.fulfillmentMode;
  }
  get requiresTable(): boolean {
    return this.props.requiresTable;
  }
  get requiresCustomerAddress(): boolean {
    return this.props.requiresCustomerAddress;
  }
  get minimumOrderAmount(): number {
    return this.props.minimumOrderAmount;
  }
  get deliveryFee(): number {
    return this.props.deliveryFee;
  }
  get sortOrder(): number {
    return this.props.sortOrder;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

function requireAmount(amount: number, field: string): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new ValidationDomainError(`${field} debe ser mayor o igual a 0`);
  }
  return Money.of(amount).amount;
}

/** Only dine-in can ask for a table and only delivery for an address. */
function assertConsistent(props: ServiceTypeProps): void {
  if (
    props.requiresTable &&
    props.fulfillmentMode !== FulfillmentMode.DINE_IN
  ) {
    throw new ValidationDomainError('Solo un tipo DINE_IN puede exigir mesa');
  }
  if (
    props.requiresCustomerAddress &&
    props.fulfillmentMode !== FulfillmentMode.DELIVERY
  ) {
    throw new ValidationDomainError(
      'Solo un tipo DELIVERY puede exigir dirección de entrega',
    );
  }
}
