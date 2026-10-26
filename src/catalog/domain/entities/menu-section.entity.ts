import { requireText } from '../../../common/domain/value-objects/required-text.js';

export interface MenuSectionProps {
  id: string;
  menuId: string;
  /** Optional: the section may reuse a category's name and meaning. */
  categoryId: string | null;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuSectionDetails {
  categoryId?: string | null;
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * Visible block of one menu (Entradas, Promociones, Makis...). The same
 * product can sit in different sections depending on the menu.
 */
export class MenuSection {
  private constructor(private props: MenuSectionProps) {}

  static create(params: MenuSectionDetails & { id: string; menuId: string; name: string }): MenuSection {
    const now = new Date();
    const section = new MenuSection({
      id: params.id,
      menuId: params.menuId,
      categoryId: null,
      name: '',
      sortOrder: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    section.update(params);
    return section;
  }

  static fromPersistence(props: MenuSectionProps): MenuSection {
    return new MenuSection(props);
  }

  update(params: MenuSectionDetails): void {
    if (params.categoryId !== undefined) {
      this.props.categoryId = params.categoryId;
    }
    if (params.name !== undefined) {
      this.props.name = requireText(params.name, 'El nombre de la sección', {
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
  get menuId(): string {
    return this.props.menuId;
  }
  get categoryId(): string | null {
    return this.props.categoryId;
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
