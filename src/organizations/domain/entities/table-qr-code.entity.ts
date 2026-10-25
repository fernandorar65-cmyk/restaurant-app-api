export interface TableQrCodeProps {
  id: string;
  codeUrl: string;
  diningTableId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TableQrCode {
  private constructor(private props: TableQrCodeProps) {}

  static create(params: {
    id: string;
    codeUrl: string;
    diningTableId: string;
  }): TableQrCode {
    const now = new Date();
    return new TableQrCode({
      id: params.id,
      codeUrl: params.codeUrl,
      diningTableId: params.diningTableId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: TableQrCodeProps): TableQrCode {
    return new TableQrCode(props);
  }

  update(params: { codeUrl?: string; diningTableId?: string }): void {
    if (params.codeUrl) {
      this.props.codeUrl = params.codeUrl;
    }
    if (params.diningTableId) {
      this.props.diningTableId = params.diningTableId;
    }
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get codeUrl(): string {
    return this.props.codeUrl;
  }
  get diningTableId(): string {
    return this.props.diningTableId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
