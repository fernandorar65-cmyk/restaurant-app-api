import { Attention } from '../entities/attention.entity.js';
import { Fulfillment } from '../entities/fulfillment.entity.js';
import type { FulfillmentDetails } from '../entities/fulfillment.entity.js';
import type { ServiceType } from '../entities/service-type.entity.js';
import type { AttentionStatus } from '../enums/attention-status.enum.js';
import { FulfillmentMode } from '../enums/fulfillment-mode.enum.js';
import { FulfillmentType } from '../enums/fulfillment-type.enum.js';
import { InvalidServiceSetupError } from '../exceptions/attention.errors.js';
import type { StatusRef } from '../workflows.js';

/** A new attention ready to be saved, together with its pickup/delivery data. */
export interface AttentionOpening {
  attention: Attention;
  fulfillment: Fulfillment | null;
}

/**
 * The service type decides how an attention opens: a table when it requires
 * one (and none otherwise), contact data for pickup/delivery, an address when
 * it requires one, and the restaurant's delivery fee.
 */
export function planAttentionOpening(params: {
  attentionId: string;
  fulfillmentId: string;
  attentionNumber: string;
  serviceType: ServiceType;
  /** The restaurant's initial attention status. */
  status: StatusRef<AttentionStatus>;
  table: { id: string; restaurantId: string } | null;
  customerUserId?: string | null;
  fulfillment?: FulfillmentDetails;
}): AttentionOpening {
  const { serviceType, table } = params;
  if (table && table.restaurantId !== serviceType.restaurantId) {
    throw new InvalidServiceSetupError(
      'La mesa no pertenece a la sede del tipo de servicio',
    );
  }
  const attention = Attention.open({
    id: params.attentionId,
    attentionNumber: params.attentionNumber,
    restaurantId: serviceType.restaurantId,
    serviceType: serviceType.ref,
    status: params.status,
    diningTableId: table?.id ?? null,
    customerUserId: params.customerUserId,
  });
  if (serviceType.fulfillmentMode === FulfillmentMode.DINE_IN) {
    return { attention, fulfillment: null };
  }

  if (!params.fulfillment) {
    throw new InvalidServiceSetupError(
      `${serviceType.name} requiere datos de contacto (y de entrega)`,
    );
  }
  if (
    serviceType.requiresCustomerAddress &&
    !params.fulfillment.deliveryAddress?.trim()
  ) {
    throw new InvalidServiceSetupError(
      `${serviceType.name} requiere la dirección de entrega`,
    );
  }
  const fulfillment = Fulfillment.create({
    ...params.fulfillment,
    id: params.fulfillmentId,
    attentionId: attention.id,
    type:
      serviceType.fulfillmentMode === FulfillmentMode.DELIVERY
        ? FulfillmentType.DELIVERY
        : FulfillmentType.PICKUP,
    // The fee is the restaurant's, never the client's.
    deliveryFee: serviceType.deliveryFee,
  });
  return { attention, fulfillment };
}
