export enum DiningTableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
}

export interface DiningTableProps {
  id: string;
  tableNumber: string;
  capacity: number;
  status: DiningTableStatus;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class DiningTable {
  private constructor(private props: DiningTableProps) {}

  static create(params: {
    id: string;
    tableNumber: string;
    capacity: number;
    status?: DiningTableStatus;
    restaurantId: string;
  }): DiningTable {
    const now = new Date();
    return new DiningTable({
      id: params.id,
      tableNumber: params.tableNumber,
      capacity: params.capacity,
      status: params.status ?? DiningTableStatus.AVAILABLE,
      restaurantId: params.restaurantId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: DiningTableProps): DiningTable {
    return new DiningTable(props);
  }

  update(params: {
    tableNumber?: string;
    capacity?: number;
    status?: DiningTableStatus;
    restaurantId?: string;
  }): void {
    if (params.tableNumber) {
      this.props.tableNumber = params.tableNumber;
    }
    if (params.capacity !== undefined) {
      this.props.capacity = params.capacity;
    }
    if (params.status) {
      this.props.status = params.status;
    }
    if (params.restaurantId) {
      this.props.restaurantId = params.restaurantId;
    }
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get tableNumber(): string {
    return this.props.tableNumber;
  }
  get capacity(): number {
    return this.props.capacity;
  }
  get status(): DiningTableStatus {
    return this.props.status;
  }
  get restaurantId(): string {
    return this.props.restaurantId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
