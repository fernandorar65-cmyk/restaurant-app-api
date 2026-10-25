export interface OrganizationProps {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Organization {
  private constructor(private props: OrganizationProps) {}

  static create(params: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  }): Organization {
    Organization.validateName(params.name);
    const now = new Date();
    return new Organization({
      id: params.id,
      name: params.name,
      email: params.email ?? null,
      phone: params.phone ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: OrganizationProps): Organization {
    return new Organization(props);
  }

  private static validateName(name: string): void {
    if (name.trim().length < 2) {
      throw new Error('El nombre de la organización debe tener al menos 2 caracteres');
    }
  }

  update(params: { name?: string; email?: string; phone?: string }): void {
    if (params.name) {
      Organization.validateName(params.name);
      this.props.name = params.name;
    }
    if (params.email !== undefined) {
      this.props.email = params.email;
    }
    if (params.phone !== undefined) {
      this.props.phone = params.phone;
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
  get phone(): string | null {
    return this.props.phone;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
