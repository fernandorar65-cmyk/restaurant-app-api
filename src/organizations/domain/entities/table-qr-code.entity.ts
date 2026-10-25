import { TableQrCodeAlreadyRevokedError } from '../exceptions/table-qr-code.errors.js';

export interface TableQrCodeProps {
  id: string;
  diningTableId: string;
  tokenHash: string;
  version: number;
  isActive: boolean;
  generatedAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

/**
 * One version of a table's QR. Only the hash of the token is kept; the raw
 * token is shown once, when the QR is generated. Regenerating revokes the
 * previous version, so a leaked QR can be invalidated without touching the
 * table.
 */
export class TableQrCode {
  private constructor(private props: TableQrCodeProps) {}

  static generate(params: {
    id: string;
    diningTableId: string;
    tokenHash: string;
    version: number;
  }): TableQrCode {
    const now = new Date();
    return new TableQrCode({
      id: params.id,
      diningTableId: params.diningTableId,
      tokenHash: params.tokenHash,
      version: params.version,
      isActive: true,
      generatedAt: now,
      revokedAt: null,
      createdAt: now,
    });
  }

  static fromPersistence(props: TableQrCodeProps): TableQrCode {
    return new TableQrCode(props);
  }

  revoke(): void {
    if (!this.props.isActive) {
      throw new TableQrCodeAlreadyRevokedError(this.props.id);
    }
    this.props.isActive = false;
    this.props.revokedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get diningTableId(): string {
    return this.props.diningTableId;
  }
  get tokenHash(): string {
    return this.props.tokenHash;
  }
  get version(): number {
    return this.props.version;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get generatedAt(): Date {
    return this.props.generatedAt;
  }
  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
