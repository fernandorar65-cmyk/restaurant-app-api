import { ValidationDomainError } from '../../../common/domain/domain-error.js';
import { requireText } from '../../../common/domain/value-objects/required-text.js';
import { TableOperationalStatus } from '../enums/table-operational-status.enum.js';
import { TableServiceStatus } from '../enums/table-service-status.enum.js';

export interface DiningTableProps {
  id: string;
  restaurantId: string;
  floorId: string;
  code: string;
  name: string;
  capacity: number | null;
  operationalStatus: TableOperationalStatus;
  serviceStatus: TableServiceStatus;
  positionX: number | null;
  positionY: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiningTableDetails {
  code?: string;
  name?: string;
  capacity?: number | null;
  positionX?: number | null;
  positionY?: number | null;
}

/**
 * "Occupied" is deliberately not a state here: it is derived from the
 * existence of an active attention on the table (attention context).
 */
export class DiningTable {
  private constructor(private props: DiningTableProps) {}

  static create(
    params: DiningTableDetails & {
      id: string;
      restaurantId: string;
      floorId: string;
      code: string;
      name: string;
    },
  ): DiningTable {
    const now = new Date();
    const table = new DiningTable({
      id: params.id,
      restaurantId: params.restaurantId,
      floorId: params.floorId,
      code: '',
      name: '',
      capacity: null,
      operationalStatus: TableOperationalStatus.ACTIVE,
      serviceStatus: TableServiceStatus.AVAILABLE,
      positionX: null,
      positionY: null,
      createdAt: now,
      updatedAt: now,
    });
    table.applyDetails(params);
    return table;
  }

  static fromPersistence(props: DiningTableProps): DiningTable {
    return new DiningTable(props);
  }

  update(
    params: DiningTableDetails & {
      floorId?: string;
      operationalStatus?: TableOperationalStatus;
      serviceStatus?: TableServiceStatus;
    },
  ): void {
    this.applyDetails(params);
    if (params.floorId !== undefined) {
      this.props.floorId = params.floorId;
    }
    if (params.operationalStatus !== undefined) {
      this.props.operationalStatus = params.operationalStatus;
    }
    if (params.serviceStatus !== undefined) {
      this.props.serviceStatus = params.serviceStatus;
    }
    this.props.updatedAt = new Date();
  }

  private applyDetails(params: DiningTableDetails): void {
    if (params.code !== undefined) {
      this.props.code = requireText(params.code, 'El código de la mesa', {
        max: 50,
      });
    }
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre de la mesa', {
        max: 100,
      });
    }
    if (params.capacity !== undefined) {
      if (params.capacity !== null && params.capacity <= 0) {
        throw new ValidationDomainError('La capacidad debe ser mayor a 0');
      }
      this.props.capacity = params.capacity;
    }
    if (params.positionX !== undefined) {
      this.props.positionX = params.positionX;
    }
    if (params.positionY !== undefined) {
      this.props.positionY = params.positionY;
    }
  }

  /** Only operationally active tables can receive diners. */
  get isOperational(): boolean {
    return this.props.operationalStatus === TableOperationalStatus.ACTIVE;
  }

  get id(): string {
    return this.props.id;
  }
  get restaurantId(): string {
    return this.props.restaurantId;
  }
  get floorId(): string {
    return this.props.floorId;
  }
  get code(): string {
    return this.props.code;
  }
  get name(): string {
    return this.props.name;
  }
  get capacity(): number | null {
    return this.props.capacity;
  }
  get operationalStatus(): TableOperationalStatus {
    return this.props.operationalStatus;
  }
  get serviceStatus(): TableServiceStatus {
    return this.props.serviceStatus;
  }
  get positionX(): number | null {
    return this.props.positionX;
  }
  get positionY(): number | null {
    return this.props.positionY;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
