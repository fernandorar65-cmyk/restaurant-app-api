export interface RolePermissionProps {
  roleId: string;
  permissionId: string;
  createdAt: Date;
}

/** Grant of a permission to a role, identified by the (role, permission) pair. */
export class RolePermission {
  private constructor(private props: RolePermissionProps) {}

  static create(params: { roleId: string; permissionId: string }): RolePermission {
    return new RolePermission({ ...params, createdAt: new Date() });
  }

  static fromPersistence(props: RolePermissionProps): RolePermission {
    return new RolePermission(props);
  }

  get roleId(): string {
    return this.props.roleId;
  }
  get permissionId(): string {
    return this.props.permissionId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
