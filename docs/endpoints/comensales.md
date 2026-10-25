# Endpoints · Comensal

API que consume la app del comensal: buscar restaurantes, ver la carta, pedir en mesa, recojo o delivery, pagar y seguir el pedido.

Tablas de referencia: [diseno-tablas.md](diseno-tablas.md). Endpoints del personal: [endpoints-restaurante.md](endpoints-restaurante.md).

## Convenciones

- Base: `/api/v1`.
- Autenticación: JWT del **comensal** (`Authorization: Bearer <token>`). Es un token distinto al del personal y no sirve en `/owner/*`.
- Columna **Auth**:
  - `público`: no requiere login.
  - `opcional`: funciona sin login; con login asocia el pedido al comensal.
  - `comensal`: requiere login.
- Respuestas de error: `{ "code": "TABLE_HAS_OPEN_ORDER", "message": "…" }`.
  - `400` datos inválidos · `401` sin sesión · `403` sin acceso · `404` no existe · `409` conflicto de estado · `422` regla de negocio.
- Listados paginados: `?page=1&limit=20` → `{ "data": [], "meta": { "page", "limit", "total" } }`.
- Las acciones que pueden repetirse por doble clic o mala red (crear pedido, enviar ronda, pagar) aceptan el header `Idempotency-Key`.
- Para los pedidos sin login, el backend devuelve un `guestToken`. La app lo envía en el header `X-Guest-Token` para consultar y seguir operando ese pedido.

---

## 1. Acceso y cuenta

Rutas del front: `/acceso`, `/customer/auth/login`, `/customer/auth/register`, `/perfil`.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/customer/auth/register` | público | Crea la cuenta del comensal y devuelve la sesión |
| POST | `/customer/auth/login` | público | Inicia sesión con email y contraseña |
| POST | `/customer/auth/refresh` | público | Renueva el access token con el refresh token |
| POST | `/customer/auth/logout` | comensal | Invalida el refresh token |
| POST | `/customer/auth/forgot-password` | público | Envía un correo para restablecer la contraseña |
| POST | `/customer/auth/reset-password` | público | Restablece la contraseña con el token del correo |
| GET | `/customer/me` | comensal | Perfil del comensal |
| PATCH | `/customer/me` | comensal | Actualiza nombre, teléfono, cumpleaños, preferencias, alergias y opt-in |
| PATCH | `/customer/me/password` | comensal | Cambia la contraseña (pide la actual) |
| DELETE | `/customer/me` | comensal | Elimina la cuenta (soft delete) |

`POST /customer/auth/register`
```json
{ "name": "Ana Torres", "email": "ana@mail.com", "password": "********", "marketingOptIn": false }
```
Respuesta (también la de login):
```json
{
  "accessToken": "…",
  "refreshToken": "…",
  "customer": { "id": "…", "name": "Ana Torres", "email": "ana@mail.com" }
}
```

### Direcciones `[F2]`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/customer/me/addresses` | comensal | Lista las direcciones guardadas |
| POST | `/customer/me/addresses` | comensal | Agrega una dirección |
| PATCH | `/customer/me/addresses/:id` | comensal | Edita una dirección o la marca como predeterminada |
| DELETE | `/customer/me/addresses/:id` | comensal | Elimina una dirección |

---

## 2. Descubrir restaurantes

Ruta del front: `/` (mapa, buscador y recientes).

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/restaurants` | público | Lista los locales activos |
| GET | `/restaurants/:slug` | público | Detalle público de un local |
| GET | `/customer/me/recent-restaurants` | comensal | Locales visitados recientemente |

Filtros de `GET /restaurants`:
- `q`: busca por nombre o tipo de cocina.
- `city`, `cuisine`.
- `lat`, `lng`, `radiusKm`: locales cercanos, ordenados por distancia.
- `fulfillment=dine_in|pickup|delivery`: solo los que ofrecen esa modalidad.
- `openNow=true`.

Respuesta de cada local: `id`, `slug`, `name`, `cuisine`, `address`, `city`, `lat`, `lng`, `imageUrl`, `fulfillmentModes`, `currency`, `isOpen`, `distanceKm`.

---

## 3. Carta

Ruta del front: `/:restaurantSlug/menu`.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/restaurants/:slug/menu` | público | Carta publicada: categorías ordenadas con sus productos activos |
| GET | `/restaurants/:slug/products/:productId` | público | Detalle de un plato |
| GET | `/restaurants/:slug/products/search?q=&limit=6` | público | Sugerencias del buscador de la carta |

Filtro opcional de `GET /restaurants/:slug/menu`: `fulfillment=pickup|delivery`, para ocultar los platos que no se ofrecen para llevar.

Respuesta resumida:
```json
{
  "menu": { "id": "…", "name": "Carta principal" },
  "categories": [
    {
      "id": "…", "name": "Entradas", "position": 0,
      "products": [
        { "id": "…", "name": "Causa limeña", "description": "…", "price": 28.00,
          "imageUrl": "…", "prepMinutes": 10, "isAvailable": true,
          "tags": ["recomendado"], "allergens": ["Mariscos"] }
      ]
    }
  ]
}
```

---

## 4. Entrada por QR

Ruta del front: `/table/:tableId`. El QR lleva un **token** y no el id de la mesa, para que se pueda rotar.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/tables/qr/:token` | público | Resuelve el QR: devuelve el local, la mesa y la cuenta abierta (si existe) |

Respuesta:
```json
{
  "restaurant": { "id": "…", "slug": "bodega-san-telmo-grand-cru", "name": "…" },
  "table": { "id": "…", "number": 12, "status": "occupied" },
  "openOrder": { "id": "…", "code": "A-0142", "status": "open" }
}
```
- `404 QR_INVALID` si el token no existe o fue revocado.
- `422 TABLE_DISABLED` si la mesa está deshabilitada.

---

## 5. Carrito y pedido

Rutas del front: `/cart`, `/pedido/entrega`.

El carrito vive en el front. Antes de confirmar, se valida contra el backend.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/restaurants/:slug/cart/validate` | público | Valida disponibilidad, precios actuales y modalidad. Devuelve los problemas por ítem |
| POST | `/orders` | opcional | Crea la cuenta con su primera ronda |
| POST | `/orders/:id/rounds` | opcional | Agrega otra ronda a una cuenta abierta (sigue pidiendo en la mesa) |
| DELETE | `/orders/:id/items/:itemId` | opcional | Cancela un plato propio mientras siga en `pending` |

`POST /restaurants/:slug/cart/validate`
```json
{
  "fulfillmentType": "dine_in",
  "items": [{ "productId": "…", "quantity": 2, "unitPrice": 28.00 }]
}
```
Respuesta:
```json
{
  "valid": false,
  "issues": [
    { "productId": "…", "code": "PRODUCT_UNAVAILABLE" },
    { "productId": "…", "code": "PRICE_CHANGED", "currentPrice": 30.00 }
  ],
  "total": 56.00
}
```

`POST /orders`
```json
{
  "restaurantId": "…",
  "fulfillmentType": "dine_in",
  "tableToken": "qr-token",
  "addressId": null,
  "guestName": "Ana",
  "guestsCount": 2,
  "items": [{ "productId": "…", "quantity": 2, "notes": "Sin cebolla" }]
}
```
Reglas:
- `dine_in` exige `tableToken`. Si la mesa ya tiene una cuenta abierta, la ronda se agrega a esa cuenta en lugar de crear otra.
- `delivery` exige `addressId` (con login) o una dirección en el body (sin login).
- `pickup` no lleva mesa ni dirección.
- El backend copia el nombre y el precio de cada producto; el front no envía precios.
- Errores: `422 PRODUCT_UNAVAILABLE`, `422 FULFILLMENT_NOT_OFFERED`, `422 RESTAURANT_CLOSED`.

Respuesta: la cuenta creada (igual que `GET /orders/:id`) más el `guestToken` si no hay login.

---

## 6. Seguimiento y cuenta

Rutas del front: `/orders/:attentionId`, `/orders/:attentionId/cuenta`.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/orders/:id` | opcional | Cuenta con sus rondas, platos y estado de cada uno |
| GET | `/orders/:id/timeline` | opcional | Historial de estados de la cuenta y sus platos |
| GET | `/orders/:id/bill` | opcional | Resumen para pagar: ítems, descuentos, pagado y saldo |
| POST | `/orders/:id/request-bill` | opcional | Pide la cuenta (avisa al personal) |
| GET | `/orders/:id/events` | opcional | Stream SSE con los cambios en tiempo real (reemplaza el polling) |

Acceso a la cuenta: lo tiene el comensal dueño del pedido, quien presente el `X-Guest-Token` o quien entró por el QR de esa mesa.

Eventos de `GET /orders/:id/events`:
- `item.status_changed` → `{ itemId, from, to, reason? }`
- `order.status_changed` → `{ from, to }`
- `payment.updated` → `{ paymentId, status }`

`GET /orders/:id/bill`
```json
{
  "items": [
    { "id": "…", "name": "Causa limeña", "quantity": 2, "subtotal": 56.00, "paidAmount": 0, "customerId": "…" }
  ],
  "subtotal": 56.00,
  "discountTotal": 0,
  "total": 56.00,
  "paid": 0,
  "balance": 56.00
}
```

---

## 7. Pago

Rutas del front: `/pago`, `/pago/:method`, `/pago/listo`.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/restaurants/:slug/payment-methods` | público | Métodos que acepta el local y sus datos (número de Yape o Plin, cuenta bancaria) |
| POST | `/orders/:id/payments` | opcional | Registra un pago total o parcial |
| GET | `/orders/:id/payments/:paymentId` | opcional | Estado de un pago |
| POST | `/payments/webhooks/:provider` | proveedor | Confirmación de la pasarela (firma verificada). No lo llama la app |

`POST /orders/:id/payments` (header `Idempotency-Key`)
```json
{
  "method": "yape",
  "amount": 56.00,
  "tipAmount": 5.00,
  "payerName": "Ana",
  "externalReference": "OP-998877",
  "itemIds": ["…", "…"],
  "cardToken": null
}
```
Comportamiento por método:
- `card`: con `cardToken` de la pasarela. Queda `approved` o `rejected` según la respuesta.
- `yape`, `plin` y `transfer`: queda `pending` con el número de operación hasta que el personal lo confirme.
- `cash`: queda `pending` y el mozo lo cobra en la mesa.
- `itemIds` es opcional: si viene, el pago cubre solo esos platos (cuenta dividida).
- Errores: `422 AMOUNT_EXCEEDS_BALANCE`, `409 ORDER_ALREADY_PAID`.

---

## 8. Historial

Ruta del front: `/mis-visitas`.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/customer/me/orders` | comensal | Pedidos del comensal, más recientes primero (`?status=`, paginado) |
| GET | `/customer/me/orders/:id` | comensal | Detalle de un pedido pasado |
| POST | `/customer/me/orders/:id/reorder` | comensal | Arma un carrito con los mismos platos, validados contra la carta actual |

---

## Resumen por flujo

```
Comensal en mesa      GET /tables/qr/:token → GET /restaurants/:slug/menu → POST /cart/validate
                      → POST /orders → GET /orders/:id/events → POST /orders/:id/rounds
                      → POST /orders/:id/request-bill → POST /orders/:id/payments

Recojo / delivery     GET /restaurants → GET /restaurants/:slug/menu → POST /cart/validate
                      → POST /orders → POST /orders/:id/payments → GET /orders/:id/events

Cuenta                POST /customer/auth/register | login → GET|PATCH /customer/me
                      → GET /customer/me/orders
```
