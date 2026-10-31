# Pendientes de arquitectura

Seguimiento de lo que falta corregir tras la migración al modelo Restaurant CMR (38 tablas, 7 contextos).

**Última actualización:** 2026-10-29 · **Resumen:** 28 hechos · 14 pendientes (1 crítico)

| Leyenda | |
|---|---|
| ✅ Hecho | Implementado y verificado con el smoke test |
| ⏳ Pendiente | Por hacer |
| 🆕 Nuevo | Detectado durante la implementación |
| 🔴 Crítica · 🟠 Alta · 🟡 Media · 🟢 Baja | Prioridad |

## Tabla

| # | Estado | Prioridad | Área | Problema | Dónde | Corrección propuesta | Esfuerzo |
|---|---|---|---|---|---|---|---|
| 1 | ✅ Hecho | 🔴 Crítica | Concurrencia | Una orden podía reabrir una atención que se canceló o cerró mientras tanto: se leía fuera de la transacción y la `version` no se comparaba | [orders.service.ts](../src/attention/application/orders/orders.service.ts) | `placeOrder()` toma la atención con `FOR UPDATE` dentro de la transacción; el `requestId` repetido se detecta bajo ese bloqueo | — |
| 2 | ✅ Hecho | 🔴 Crítica | Concurrencia | `requestBill`, `close` y `cancel` pisaban cambios simultáneos | [attentions.service.ts](../src/attention/application/attentions/attentions.service.ts) | Mismo bloqueo de fila; `close` calcula el saldo después de tomarlo | — |
| 3 | ✅ Hecho | 🔴 Crítica | Consistencia | `start()` abría la atención y registraba al participante antes de validar los productos: dejaba atenciones vacías si el pedido fallaba | [customer-attentions.service.ts](../src/attention/application/customer-attentions/customer-attentions.service.ts) | Valida mesa/sede, modalidad y carrito primero; apertura, participante y orden en una sola transacción, con un reintento si otro comensal abrió la mesa a la vez | — |
| 4 | ✅ Hecho | 🔴 Crítica | Seguridad | Ningún controller fuera de autenticación exigía sesión | [auth.guard.ts](../src/iam/infrastructure/http/guards/auth.guard.ts) | Guard global; solo las rutas marcadas `@Public()` quedan abiertas | — |
| 5 | ⏳ Pendiente | 🔴 Crítica | Seguridad | No se aplican permisos ni el alcance por organización y sede: cualquier usuario con sesión opera cualquier organización | Todos los CRUD | `@RequirePermission(...)` más validación con la membresía (`canAccessRestaurant()`) | Alto |
| 6 | ✅ Hecho | 🔴 Crítica | Seguridad | Los secretos JWT tenían valor por defecto en el código | [environment.validation.ts](../src/common/infrastructure/config/environment.validation.ts) | La app no arranca sin `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`; deben ser distintos y, en producción, de 32+ caracteres y no los de `.env.example` | — |
| 7 | ✅ Hecho | 🟠 Alta | Seguridad | La rotación del refresh token no era atómica | [typeorm-refresh-token.repository.ts](../src/iam/infrastructure/persistence/typeorm/repositories/typeorm-refresh-token.repository.ts) | `UPDATE` condicional: de 5 refresh simultáneos solo 1 gana | — |
| 8 | ⏳ Pendiente | 🟠 Alta | Base de datos | `synchronize` activo y sin migraciones | [typeorm.config.ts](../src/common/persistence/database/typeorm.config.ts) | Migración inicial y `synchronize: false` | Medio |
| 9 | ⏳ Pendiente | 🟠 Alta | Base de datos | No hay datos semilla de permisos; el rol OWNER se crea sin permisos si la tabla está vacía | — | Migración o seed idempotente con los 10 permisos base | Bajo |
| 10 | ✅ Hecho | 🟠 Alta | Negocio | No existía el registro transaccional del propietario | [owner-registration.service.ts](../src/iam/application/owner-registration/owner-registration.service.ts) | `POST /api/v1/owner/auth/register`: usuario, organización, rol OWNER, membresía y sede en una sola transacción | — |
| 11 | ✅ Hecho | 🟠 Alta | Datos | Los `DELETE` eran físicos | Servicios y controllers CRUD | Baja lógica en 14 entidades; borrado físico solo en asociaciones puras y alérgenos | — |
| 12 | ⏳ Pendiente | 🟠 Alta | Tests | No hay tests unitarios del dominio; el smoke test (98 chequeos) no está en el repo | `test/` | Pasarlo a `test/` como e2e y agregar tests de las entidades | Medio |
| 13 | ✅ Hecho | 🟡 Media | Acoplamiento | Adaptadores con SQL directo a tablas de otro contexto | [identity.module.ts](../src/iam/identity.module.ts), [payment-ledger.service.ts](../src/payments/application/payment-ledger/payment-ledger.service.ts) | `IdentityModule` separado de IAM; `payments` expone su servicio de consulta | — |
| 14 | ✅ Hecho | 🟡 Media | Acoplamiento | `attention` importaba el guard de IAM | [auth.service.ts](../src/iam/application/auth/auth.service.ts) | IAM expone `authenticateBearer()` | — |
| 15 | ✅ Hecho | 🟡 Media | Dominio | El dominio de `attention` usaba `node:crypto` | `attention.entity.ts`, `order-item.entity.ts` | IDs y número de atención generados en la capa de aplicación | — |
| 16 | ✅ Hecho | 🟡 Media | Escalabilidad | No había paginación en los listados | Repositorios y controllers | `?page&limit` (máx. 100) con respuesta `{ items, meta }` | — |
| 17 | ✅ Hecho | 🟡 Media | Funcionalidad | El tablero de cocina incluía platos de atenciones cerradas | [typeorm-order-item.repository.ts](../src/attention/infrastructure/persistence/typeorm/repositories/typeorm-order-item.repository.ts) | Por defecto solo atenciones activas; `includeClosed=true` para ver todo | — |
| 18 | ✅ Hecho | 🟡 Media | Funcionalidad | Payments no tenía endpoints para registrar pagos, así que el cierre diario mostraba ventas en 0 y ninguna atención podía cerrarse con saldo | [payments.service.ts](../src/payments/application/payments/payments.service.ts) | Pagos totales, por monto y por productos con asignaciones (ver #35). Los reembolsos quedan en #36 | — |
| 19 | ✅ Hecho | 🟡 Media | Funcionalidad | Finance no tenía servicios ni endpoints | `src/finance` | Categorías de gasto, gastos con anulación y cierre diario con vista previa | — |
| 20 | ✅ Hecho | 🟢 Baja | Funcionalidad | Recetas, ingredientes y modalidades por sede (los alérgenos se retiraron después, ver #32) | Catalog, Inventory, Organizations | Implementado con endpoints y validaciones | — |
| 21 | ✅ Hecho | 🟢 Baja | Funcionalidad | El fulfillment no tenía transiciones de estado | [fulfillment.entity.ts](../src/attention/domain/entities/fulfillment.entity.ts) | Máquina de estados de recojo y delivery | — |
| 22 | ✅ Hecho | 🟢 Baja | Calidad | Los mensajes de error mezclaban inglés y español | `domain/exceptions`, guards, filtro | Todo en español, con `errorCode` estable | — |
| 23 | ⏳ Pendiente | 🟢 Baja | Docs | `arquitectura-ddd-hexagonal.md` y `Modelo de tablas.md` están desactualizados | [docs/](.) | Actualizarlos al estado real | Bajo |
| 24 | ⏳ Pendiente | 🟢 Baja | Tests | `test/app.e2e-spec.ts` no compila (ya fallaba antes de la migración) | [app.e2e-spec.ts](../test/app.e2e-spec.ts) | Importar `supertest/types.js`, o reemplazarlo por el smoke test | Bajo |
| 25 | ⏳ Pendiente | 🟡 Media | Negocio | El monto mínimo de la modalidad se informa en el carrito pero no bloquea el pedido | [customer-attentions.service.ts](../src/attention/application/customer-attentions/customer-attentions.service.ts) | Validarlo antes de abrir la atención (va junto con el #3) | Bajo |
| 26 | ✅ Hecho | 🟢 Baja | Funcionalidad | Las recetas no descontaban stock automáticamente | Inventory + Attention | Al pasar un plato a `PREPARING` se registra un `USAGE` por receta. Desde #38 queda apagado por defecto (`INVENTORY_AUTO_CONSUMPTION`), ver #39 | — |
| 27 | ✅ Hecho | 🟢 Baja | Calidad | Los mensajes de validación de class-validator estaban en inglés | [validation-exception.factory.ts](../src/common/infrastructure/http/validation-exception.factory.ts) | Traducción global con la ruta del campo | — |
| 29 | ✅ Hecho | 🟠 Alta | Modelo | (Observación ACMR 1) El puesto del empleado era texto libre y el área un enum fijo | [work-areas](../src/organizations/application/work-areas/work-areas.service.ts), [job-positions](../src/organizations/application/job-positions/job-positions.service.ts) | Tablas `work_areas` y `job_positions` por organización (nombres únicos sin distinguir mayúsculas, con `citext`); `employees.job_position_id` reemplaza a `position_name` y `area`; bajas lógicas | — |
| 30 | ✅ Hecho | 🟠 Alta | Modelo | (Observación ACMR 2) La tabla `table_qr_codes` era excesiva para un QR por mesa | [dining-tables.service.ts](../src/organizations/application/dining-tables/dining-tables.service.ts) | QR en `dining_tables` (`qr_token_hash`, `qr_version`, `qr_generated_at`, `qr_asset_url`); rotar invalida el anterior; solo se guarda el SHA-256 | — |
| 32 | ✅ Hecho | 🟡 Media | Modelo | (Observación ACMR 3) Los alérgenos no forman parte del MVP | `src/catalog` | Se eliminaron `allergens` y `product_allergens` con su código y endpoints; `product_ingredients` sigue siendo opcional | — |
| 33 | ✅ Hecho | 🟠 Alta | Modelo | (Observación ACMR 4) Las categorías eran por sede, de un solo nivel, y cada producto tenía una sola | [categories.service.ts](../src/catalog/application/categories/categories.service.ts), [menu-sections.service.ts](../src/catalog/application/menu-sections/menu-sections.service.ts) | `categories` por organización y en árbol (sin ciclos, nombre único por nivel); `product_categories` como relación muchos a muchos; `menu_sections` y `menu_products.menu_section_id`. Sin tabla universal ni contexto Taxonomy | — |
| 34 | ✅ Hecho | 🟠 Alta | Modelo | (Observación ACMR) `order_batches` no reflejaba el lenguaje del negocio y la ronda no tenía un ciclo operativo propio | [orders.service.ts](../src/attention/application/orders/orders.service.ts), [order.entity.ts](../src/attention/domain/entities/order.entity.ts) | Tabla `orders` y `order_items.order_id`; `OrderStatus` operativo calculado desde los ítems; cancelar una orden completa sin tocar la atención; rutas `/orders` y `/api/v1/attentions` | — |
| 35 | ✅ Hecho | 🟠 Alta | Modelo | (Observación ACMR) Pagos acoplados a estados fijos y sin trazabilidad por producto ni por pasarela | [payments.service.ts](../src/payments/application/payments/payments.service.ts), [provider-events.service.ts](../src/payments/application/provider-events/provider-events.service.ts) | Catálogos `payment_statuses` / `refund_statuses`, mapeos por proveedor, eventos idempotentes, asignaciones por producto y envío con reparto determinista, bloqueo por atención contra cobros simultáneos, API privada `/platform` con `users.is_platform_admin` | — |
| 36 | ⏳ Pendiente | 🟡 Media | Negocio | Decidir si el MVP tendrá reembolsos parciales por producto (`refund_allocations`) o solo totales; las tablas existen pero no hay flujo | `src/payments` | Implementar el flujo de reembolso según la decisión | Medio |
| 37 | ⏳ Pendiente | 🟡 Media | Integración | Los eventos de pasarela entran por una ruta privada de ACMR; falta el webhook público de cada proveedor con verificación de firma | `src/payments` | Al elegir la pasarela: endpoint `@Public()` por proveedor que valide la firma y llame a `ProviderEventsService` | Medio |
| 38 | ✅ Hecho | 🟠 Alta | Modelo | (Observación ACMR) `supplies` mezclaba el insumo maestro con el stock de cada sede; unidades en texto libre y `ADJUSTMENT` ambiguo | [restaurant-supplies.service.ts](../src/inventory/application/restaurant-supplies/restaurant-supplies.service.ts), [restaurant-supply.entity.ts](../src/inventory/domain/entities/restaurant-supply.entity.ts) | Insumo maestro por organización, `restaurant_supplies` por sede, catálogos `units_of_measure` e `inventory_movement_types`, `quantity_delta` firmado, conteos con `counted_quantity`, reversiones en lugar de ediciones, idempotencia y bloqueo de fila | — |
| 39 | ⏳ Pendiente | 🟡 Media | Negocio | Confirmar el flujo del descuento automático por receta (estado del pedido, reversión al cancelar, recetas por sede, sustituciones) para encenderlo | `src/inventory` | Hoy existe apagado con `INVENTORY_AUTO_CONSUMPTION=false` | Medio |
| 40 | ⏳ Pendiente | 🟢 Baja | Funcionalidad | Motivos secundarios de movimiento por restaurante (`reason_id`: vencimiento, derrame, consumo del personal) | `src/inventory` | Tabla de motivos por organización que no altere el efecto del tipo | Bajo |
| 31 | ⏳ Pendiente | 🟡 Media | Docs | Consolidar las observaciones de revisión del modelo en el SQL general y el documento definitivo de tablas. El diagrama ya está al día (26/10: 48 tablas del modelo + 2 de auth) | `docs/modelo-tablas/` | Hacerlo al terminar la revisión completa del modelo, no por cada observación | Bajo |
| 28 | 🆕 Nuevo | 🟢 Baja | Funcionalidad | La API no permite vincular un gasto a una compra de inventario (`expenses.inventory_movement_id`) | `finance` + `inventory` | Aceptar `inventoryMovementId` validando que sea un `PURCHASE` de la misma sede, o crear el gasto automáticamente al registrar la compra | Medio |
| 41 | ✅ Hecho | 🟠 Alta | Observabilidad | Solo se registraban los 5xx, sin forma de relacionar un error con el request que lo causó | [logging/](../src/common/infrastructure/logging) | `X-Request-Id` por request (se reutiliza el del gateway si es válido) presente en cada línea de log y en el cuerpo de los errores; una línea de acceso por request con estado, `errorCode`, duración y usuario; 5xx con stack; `LOG_LEVEL` y `LOG_FORMAT` (`json` por defecto en producción); rechazos de promesas no manejados registrados. No se loguean cuerpos y el token del QR se enmascara. Los `error`/`fatal` se guardan además en la tabla `error_logs` (contexto `observability`), consultable en `GET /platform/error-logs` y depurada según `ERROR_LOG_RETENTION_DAYS` | — |
| 42 | 🆕 Nuevo | 🟡 Media | Validación | Los montos no tienen máximo: `POST /products` con `price: 1e15` pasa la validación y Postgres responde *numeric field overflow* (500) | DTOs con montos (`price`, `amount`, `deliveryFee`, `minimumAmount`…) | `@Max(9_999_999_999.99)` acorde a `NUMERIC(12,2)`, o mapear el código `22003` a 400 en el filtro | Bajo |

El detalle de lo pendiente en Finanzas (revisión ACMR) está en [finanzas-pendientes.md](finanzas-pendientes.md).

## Pendientes por prioridad

| Prioridad | Puntos |
|---|---|
| 🔴 Crítica | 5 |
| 🟠 Alta | 8, 9, 12 |
| 🟡 Media | 25, 31, 36, 37, 39, 42 |
| 🟢 Baja | 23, 24, 28, 40 |

## Orden sugerido

1. **25**: el monto mínimo de la modalidad; va en `start()`, ya transaccional.
2. **5**: permisos y alcance por membresía; ya es viable porque la sesión es obligatoria.
3. **8 y 9**: migraciones y seeds antes de cualquier ambiente compartido.
4. **12**: tests en el repo.
5. **36**: decidir el alcance de los reembolsos.
