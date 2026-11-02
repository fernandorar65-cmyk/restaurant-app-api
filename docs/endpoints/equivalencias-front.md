# Equivalencias: rutas del front → backend

Para el equipo del front. [endponits-a-hacer.md](endponits-a-hacer.md) lista la API que el front necesita, con rutas anidadas bajo `/owner/...`. El backend sigue su propia convención, y el front adapta sus URLs a ella:

- **Comensal y auth**: bajo `/api/v1/...`.
- **Portal del personal**: recursos planos en la raíz, filtrados por query (`?restaurantId=`), no anidados por sede.

Este documento cubre los 19 endpoints que faltaban y se implementaron el 2026-11-01. El detalle de cada ruta está en [endpoints-actuales.md](endpoints-actuales.md) (marcadas con 🆕) y en Swagger (`/docs`).

## Rutas

| # | El front pedía | Ruta en el backend | Diferencias de contrato |
|---|---|---|---|
| 1 | `GET /restaurants` | `GET /api/v1/restaurants` | Paginado (`items` + `meta`). Trae `services` (modalidades activas con `minimumOrderAmount` y `deliveryFee`) en lugar de `fulfillment`. No hay `imageUrl`, `category` ni `cuisine`: no existen en el modelo |
| 2 | `GET /restaurants/slug/:slug` | `GET /api/v1/restaurants/slug/:slug` | Igual |
| 3 | `GET /restaurants/:id` | `GET /api/v1/restaurants/:id` | Igual. Una sede inactiva responde 404 |
| 4 | `GET /restaurants/:id/menu` | `GET /api/v1/restaurants/:id/menu` | Responde `{ menu, sections, products }`: las "categorías" de la carta son las **secciones** del menú vigente. `products[].menuSectionId` apunta a la sección. Sin menú vigente: `menu: null` y listas vacías |
| 5 | `GET /restaurants/:id/menu/search?q=&limit=6` | `GET /api/v1/restaurants/:id/menu/search?q=&limit=6` | Busca en nombre y descripción (no hay tags). Devuelve productos con la misma forma que la carta |
| 6 | `PATCH /customer/me/password` | `PATCH /api/v1/customer/me/password` | Contraseña actual incorrecta → **401** `INVALID_CREDENTIALS`, no 422 (igual que el personal) |
| 7 | `GET /customer/me/attentions` | `GET /api/v1/customer/me/attentions` | Paginado. Cada visita: `attention`, `restaurant { id, name, slug }`, `items` cobrables, `total`, `paid`, `balance` |
| 8 | `GET /owner/me/profile` | `GET /api/v1/owner/me/profile` | Trae además `access[]` por organización (rol, sedes y `permissions`). Sirve también para armar el menú del portal |
| 9 | `GET /owner/restaurants/:id/operation` | `GET /floor-plan?restaurantId=` | `floors`, `tables` (con `occupancy` y su atención activa) y `kpis`. Las mesas se identifican por `id`/`code`, no por número. No trae `staff`, `stations` ni `alerts` |
| 10 | `GET /owner/attentions/:id/timeline` | `GET /attentions/:id/timeline` | Lista de eventos con `type`, `at`, `productName`, `fromStatus`/`toStatus` y `userId` (no `userName`) |
| 11 | `POST /owner/ordered-products/status` | `POST /order-items/status` | Cuerpo `{ restaurantId, items: [{ id, version? }], status \| statusId, reason? }`. El control optimista es por `version`, no por `fromStatus`. `failed[]` trae `errorCode` además de `message` |
| 12 | `PATCH /owner/payments/:id/status` | `PATCH /payments/:id/status` | Estados en mayúsculas (`PAID`, `FAILED`...). Sin reembolsos por ahora: `REFUNDED` → 422 `REFUNDS_NOT_ENABLED` |
| 13 | `PUT .../menu-categories/order` | `PUT /menus/:menuId/sections/order` | Cuerpo `{ ids }` con **todas** las secciones del menú; si falta o sobra alguna → 400 `INVALID_REORDER` |
| 14 | `PUT /owner/menu-categories/:id/products/order` | `PUT /menus/:id/products/order` | Cuerpo `{ menuSectionId, productIds }` con todos los productos de esa sección |
| 15 | `POST /owner/uploads/images` | `POST /uploads/images?restaurantId=` | `restaurantId` en la query. Campo `file`; JPEG, PNG, WebP o AVIF hasta 5 MB. Responde `{ key, url }`. 503 hasta que se configure el almacenamiento |
| 16 | `GET /owner/restaurants/:id/supply-movements` | `GET /inventory-movements?restaurantId=` | Paginado; filtros `supplyId`, `type`, `from`, `to`. Cada movimiento trae `restaurantSupplyId`: el nombre del insumo sale del listado de stock |
| 17 | `DELETE /owner/expense-categories/:id?moveTo=` | `DELETE /expense-categories/:id?moveTo=` | La categoría se desactiva, no se borra. Responde `{ id, movedExpenses }` |
| 18 | `GET /owner/restaurants/:id/metrics?from=&to=` | `GET /reports/metrics?restaurantId=&from=&to=` | `from`/`to` obligatorios (máx. 366 días). `totals`, `topProducts` y `stageTimes` (minutos por etapa de cocina) |
| 19 | `GET /owner/finance/daily?from=&to=&restaurantId=` | `GET /reports/daily-financials?restaurantId=&from=&to=` | `restaurantId` obligatorio (una sede por consulta). Por día: ventas, reembolsos, gastos, utilidad, ticket y método de pago. No hay `guests`, `foodCost` ni `laborCost`: no se registran |

## Diferencias generales

- **Permisos**: cada ruta exige un permiso `<área>.manage` o `<área>.read` del rol (ver [autorizacion.md](../autorizacion.md)). Los códigos que usa el front (`menu.manage`, `orders.manage`...) no existen en el backend. El catálogo real llega en `access[].permissions` de `GET /api/v1/owner/me/profile`.
- **Estados** en mayúsculas y con otros nombres: el front usa `sent`, `preparing`, `delivered` y `account-requested`; el backend usa `SUBMITTED`, `IN_PREPARATION`, `SERVED` y `BILL_REQUESTED`.
- **Errores**: además de `message`, cada error trae `errorCode` estable. Decide por él, no por el texto.
