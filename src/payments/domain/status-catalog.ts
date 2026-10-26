import { PaymentStatusCode } from './enums/payment-status-code.enum.js';
import { RefundStatusCode } from './enums/refund-status-code.enum.js';

export interface PaymentStatusDefinition {
  code: PaymentStatusCode;
  name: string;
  description: string;
  isTerminal: boolean;
  /** Only these statuses reduce what the attention owes. */
  countsTowardBalance: boolean;
  allowsRefund: boolean;
}

export interface RefundStatusDefinition {
  code: RefundStatusCode;
  name: string;
  description: string;
  isTerminal: boolean;
  /** Only these statuses reduce the net amount collected. */
  countsAsRefunded: boolean;
}

/**
 * Platform-wide catalog maintained by ACMR. The accounting effect of each
 * code is fixed here (the API can only rename or describe a status), so
 * editing the catalog never silently changes balances.
 */
export const PAYMENT_STATUSES: PaymentStatusDefinition[] = [
  {
    code: PaymentStatusCode.PENDING,
    name: 'Pendiente',
    description: 'Intento de cobro creado, pendiente de confirmación',
    isTerminal: false,
    countsTowardBalance: false,
    allowsRefund: false,
  },
  {
    code: PaymentStatusCode.PROCESSING,
    name: 'En proceso',
    description: 'La pasarela está procesando el cobro',
    isTerminal: false,
    countsTowardBalance: false,
    allowsRefund: false,
  },
  {
    code: PaymentStatusCode.PAID,
    name: 'Pagado',
    description: 'Pago confirmado; reduce el saldo',
    isTerminal: false,
    countsTowardBalance: true,
    allowsRefund: true,
  },
  {
    code: PaymentStatusCode.FAILED,
    name: 'Fallido',
    description: 'Intento fallido o rechazado',
    isTerminal: true,
    countsTowardBalance: false,
    allowsRefund: false,
  },
  {
    code: PaymentStatusCode.CANCELLED,
    name: 'Cancelado',
    description: 'Intento anulado antes de completarse',
    isTerminal: true,
    countsTowardBalance: false,
    allowsRefund: false,
  },
  {
    code: PaymentStatusCode.PARTIALLY_REFUNDED,
    name: 'Reembolsado parcialmente',
    description: 'Se devolvió una parte del importe pagado',
    isTerminal: false,
    countsTowardBalance: true,
    allowsRefund: true,
  },
  {
    code: PaymentStatusCode.REFUNDED,
    name: 'Reembolsado',
    description: 'Se devolvió todo el importe pagado',
    isTerminal: true,
    countsTowardBalance: true,
    allowsRefund: false,
  },
];

export const REFUND_STATUSES: RefundStatusDefinition[] = [
  {
    code: RefundStatusCode.PENDING,
    name: 'Pendiente',
    description: 'Reembolso solicitado',
    isTerminal: false,
    countsAsRefunded: false,
  },
  {
    code: RefundStatusCode.PROCESSING,
    name: 'En proceso',
    description: 'La pasarela está procesando el reembolso',
    isTerminal: false,
    countsAsRefunded: false,
  },
  {
    code: RefundStatusCode.SUCCEEDED,
    name: 'Reembolsado',
    description: 'Reembolso completado; reduce el neto cobrado',
    isTerminal: true,
    countsAsRefunded: true,
  },
  {
    code: RefundStatusCode.FAILED,
    name: 'Fallido',
    description: 'El reembolso no se pudo completar',
    isTerminal: true,
    countsAsRefunded: false,
  },
  {
    code: RefundStatusCode.CANCELLED,
    name: 'Cancelado',
    description: 'Reembolso anulado antes de completarse',
    isTerminal: true,
    countsAsRefunded: false,
  },
];

const BY_CODE = new Map(PAYMENT_STATUSES.map((status) => [status.code, status]));

export function paymentStatusDefinition(code: PaymentStatusCode): PaymentStatusDefinition {
  return BY_CODE.get(code) as PaymentStatusDefinition;
}
