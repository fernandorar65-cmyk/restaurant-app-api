export interface EmployeeProps {
  id: string;
  name: string;
  email: string | null;
  position: string;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Employee {
  private constructor(private props: EmployeeProps) {}

  static create(params: {
    id: string;
    name: string;
    email?: string;
    position: string;
    restaurantId: string;
  }): Employee {
    Employee.validateName(params.name);
    const now = new Date();
    return new Employee({
      id: params.id,
      name: params.name,
      email: params.email ?? null,
      position: params.position,
      restaurantId: params.restaurantId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: EmployeeProps): Employee {
    return new Employee(props);
  }

  private static validateName(name: string): void {
    if (name.trim().length < 2) {
      throw new Error('El nombre del empleado debe tener al menos 2 caracteres');
    }
  }

  update(params: {
    name?: string;
    email?: string;
    position?: string;
    restaurantId?: string;
  }): void {
    if (params.name) {
      Employee.validateName(params.name);
      this.props.name = params.name;
    }
    if (params.email !== undefined) {
      this.props.email = params.email;
    }
    if (params.position) {
      this.props.position = params.position;
    }
    if (params.restaurantId) {
      this.props.restaurantId = params.restaurantId;
    }
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get email(): string | null {
    return this.props.email;
  }
  get position(): string {
    return this.props.position;
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
