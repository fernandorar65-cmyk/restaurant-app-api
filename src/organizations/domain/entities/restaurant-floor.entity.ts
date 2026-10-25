import { requireText } from '../../../common/domain/value-objects/required-text.js';

export interface RestaurantFloorProps {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class RestaurantFloor {
  private constructor(private props: RestaurantFloorProps) {}

  static create(params: {
    id: string;
    restaurantId: string;
    name: string;
    sortOrder?: number;
  }): RestaurantFloor {
    const now = new Date();
    return new RestaurantFloor({
      id: params.id,
      restaurantId: params.restaurantId,
      name: requireText(params.name, 'El nombre del piso', { max: 100 }),
      sortOrder: params.sortOrder ?? 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: RestaurantFloorProps): RestaurantFloor {
    return new RestaurantFloor(props);
  }

  update(params: { name?: string; sortOrder?: number; isActive?: boolean }): void {
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre del piso', {
        max: 100,
      });
    }
    if (params.sortOrder !== undefined) {
      this.props.sortOrder = params.sortOrder;
    }
    if (params.isActive !== undefined) {
      this.props.isActive = params.isActive;
    }
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get restaurantId(): string {
    return this.props.restaurantId;
  }
  get name(): string {
    return this.props.name;
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
