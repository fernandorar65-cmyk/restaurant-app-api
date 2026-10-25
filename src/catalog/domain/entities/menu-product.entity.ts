import { ValidationDomainError } from '../../../common/domain/domain-error.js';

export interface MenuProductProps {
  menuId: string;
  productId: string;
  /** Price shown in this menu; the order always uses the product price. */
  displayPrice: number | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: Date;
}

export class MenuProduct {
  private constructor(private props: MenuProductProps) {}

  static create(params: {
    menuId: string;
    productId: string;
    displayPrice?: number | null;
    sortOrder?: number;
    isVisible?: boolean;
  }): MenuProduct {
    const menuProduct = new MenuProduct({
      menuId: params.menuId,
      productId: params.productId,
      displayPrice: null,
      sortOrder: 0,
      isVisible: true,
      createdAt: new Date(),
    });
    menuProduct.update(params);
    return menuProduct;
  }

  static fromPersistence(props: MenuProductProps): MenuProduct {
    return new MenuProduct(props);
  }

  update(params: {
    displayPrice?: number | null;
    sortOrder?: number;
    isVisible?: boolean;
  }): void {
    if (params.displayPrice !== undefined) {
      if (params.displayPrice !== null && params.displayPrice < 0) {
        throw new ValidationDomainError('El precio mostrado no puede ser negativo');
      }
      this.props.displayPrice = params.displayPrice;
    }
    if (params.sortOrder !== undefined) {
      this.props.sortOrder = params.sortOrder;
    }
    if (params.isVisible !== undefined) {
      this.props.isVisible = params.isVisible;
    }
  }

  get menuId(): string {
    return this.props.menuId;
  }
  get productId(): string {
    return this.props.productId;
  }
  get displayPrice(): number | null {
    return this.props.displayPrice;
  }
  get sortOrder(): number {
    return this.props.sortOrder;
  }
  get isVisible(): boolean {
    return this.props.isVisible;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
