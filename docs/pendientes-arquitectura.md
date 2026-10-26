# Pendientes de arquitectura

Seguimiento de lo que falta corregir tras la migración al modelo Restaurant CMR (38 tablas, 7 contextos).

**Última actualización:** 2026-10-26 · **Resumen:** 20 hechos · 14 pendientes (5 críticos)

| Leyenda | |
|---|---|
| ✅ Hecho | Implementado y verificado con el smoke test |
| ⏳ Pendiente | Por hacer |
| 🆕 Nuevo | Detectado durante la implementación |
| 🔴 Crítica · 🟠 Alta · 🟡 Media · 🟢 Baja | Prioridad |

## Tabla

| # | Estado | Prioridad | Área | Problema | Dónde | Corrección propuesta | Esfuerzo |
|---|---|---|---|---|---|---|---|
| 1 | ⏳ Pendiente | 🔴 Crítica | Concurrencia | Una orden puede reabrir una atención que se canceló o cerró mientras tanto: se lee fuera de la transacción y la `version` no se compara | [order-rounds.service.ts](../src/attention/application/order-rounds/order-rounds.service.ts) | Leer la atención con `FOR UPDATE` dentro de la transacción, o actualizar con `WHERE version = :leída` | Bajo |
| 2 | ⏳ Pendiente | 🔴 Crítica | Concurrencia | `requestBill`, `close` y `cancel` también pisan cambios simultáneos | [attentions.service.ts](../src/attention/application/attentions/attentions.service.ts) | Mismo bloqueo o chequeo de versión | Bajo |
| 3 | ⏳ Pendiente | 🔴 Crítica | Consistencia | `start()` abre la atención y registra al participante antes de validar los productos: deja atenciones vacías si el pedido falla | [customer-attentions.service.ts](../src/attention/application/customer-attentions/customer-attentions.service.ts) | Validar el carrito primero; apertura, participante y ronda en una sola transacción | Medio |
| 4 | ✅ Hecho | 🔴 Crítica | Seguridad | Ningún controller fuera de autenticación exigía sesión | [auth.guard.ts](../src/iam/infrastructure/http/guards/auth.guard.ts) | Guard global; solo las rutas marcadas `@Public()` quedan abiertas | — |
| 5 | ⏳ Pendiente | 🔴 Crítica | Seguridad | No se aplican permisos ni el alcance por organización y sede: cualquier usuario con sesión opera cualquier organización | Todos los CRUD | `@RequirePermission(...)` más validación con la membresía (`canAccessRestaurant()`) | Alto |
| 6 | ⏳ Pendiente | 🔴 Crítica | Seguridad | Los secretos JWT tienen valor por defecto en el código | [auth.service.ts](../src/iam/application/auth/auth.service.ts) | Fallar al arrancar si no están definidos | Bajo |
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
| 18 | ⏳ Pendiente | 🟡 Media | Funcionalidad | Payments sin endpoints para registrar pagos ni reembolsos, así que el cierre diario muestra ventas en 0 y ninguna atención puede cerrarse con saldo | `src/payments` | Fase de pagos: total, por monto, por productos, asignaciones y reembolsos | Alto |
| 19 | ✅ Hecho | 🟡 Media | Funcionalidad | Finance no tenía servicios ni endpoints | `src/finance` | Categorías de gasto, gastos con anulación y cierre diario con vista previa | — |
| 20 | ✅ Hecho | 🟢 Baja | Funcionalidad | Recetas, ingredientes y modalidades por sede (los alérgenos se retiraron después, ver #32) | Catalog, Inventory, Organizations | Implementado con endpoints y validaciones | — |
| 21 | ✅ Hecho | 🟢 Baja | Funcionalidad | El fulfillment no tenía transiciones de estado | [fulfillment.entity.ts](../src/attention/domain/entities/fulfillment.entity.ts) | Máquina de estados de recojo y delivery | — |
| 22 | ✅ Hecho | 🟢 Baja | Calidad | Los mensajes de error mezclaban inglés y español | `domain/exceptions`, guards, filtro | Todo en español, con `errorCode` estable | — |
| 23 | ⏳ Pendiente | 🟢 Baja | Docs | `arquitectura-ddd-hexagonal.md` y `Modelo de tablas.md` están desactualizados | [docs/](.) | Actualizarlos al estado real | Bajo |
| 24 | ⏳ Pendiente | 🟢 Baja | Tests | `test/app.e2e-spec.ts` no compila (ya fallaba antes de la migración) | [app.e2e-spec.ts](../test/app.e2e-spec.ts) | Importar `supertest/types.js`, o reemplazarlo por el smoke test | Bajo |
| 25 | ⏳ Pendiente | 🟡 Media | Negocio | El monto mínimo de la modalidad se informa en el carrito pero no bloquea el pedido | [customer-attentions.service.ts](../src/attention/application/customer-attentions/customer-attentions.service.ts) | Validarlo antes de abrir la atención (va junto con el #3) | Bajo |
| 26 | ✅ Hecho | 🟢 Baja | Funcionalidad | Las recetas no descontaban stock automáticamente | Inventory + Attention | Al pasar un plato a `PREPARING` se registra un `USAGE` por receta | — |
| 27 | ✅ Hecho | 🟢 Baja | Calidad | Los mensajes de validación de class-validator estaban en inglés | [validation-exception.factory.ts](../src/common/infrastructure/http/validation-exception.factory.ts) | Traducción global con la ruta del campo | — |
| 29 | ✅ Hecho | 🟠 Alta | Modelo | (Observación ACMR 1) El puesto del empleado era texto libre y el área un enum fijo | [work-areas](../src/organizations/application/work-areas/work-areas.service.ts), [job-positions](../src/organizations/application/job-positions/job-positions.service.ts) | Tablas `work_areas` y `job_positions` por organización (nombres únicos sin distinguir mayúsculas, con `citext`); `employees.job_position_id` reemplaza a `position_name` y `area`; bajas lógicas | — |
| 30 | ✅ Hecho | 🟠 Alta | Modelo | (Observación ACMR 2) La tabla `table_qr_codes` era excesiva para un QR por mesa | [dining-tables.service.ts](../src/organizations/application/dining-tables/dining-tables.service.ts) | QR en `dining_tables` (`qr_token_hash`, `qr_version`, `qr_generated_at`, `qr_asset_url`); rotar invalida el anterior; solo se guarda el SHA-256 | — |
| 32 | ✅ Hecho | 🟡 Media | Modelo | (Observación ACMR 3) Los alérgenos no forman parte del MVP | `src/catalog` | Se eliminaron `allergens` y `product_allergens` con su código y endpoints; `product_ingredients` sigue siendo opcional | — |
| 33 | ✅ Hecho | 🟠 Alta | Modelo | (Observación ACMR 4) Las categorías eran por sede, de un solo nivel, y cada producto tenía una sola | [categories.service.ts](../src/catalog/application/categories/categories.service.ts), [menu-sections.service.ts](../src/catalog/application/menu-sections/menu-sections.service.ts) | `categories` por organización y en árbol (sin ciclos, nombre único por nivel); `product_categories` como relación muchos a muchos; `menu_sections` y `menu_products.menu_section_id`. Sin tabla universal ni contexto Taxonomy | — |
| 34 | ✅ Hecho | 🟠 Alta | Modelo | (Observación ACMR) `order_batches` no reflejaba el lenguaje del negocio y la ronda no tenía un ciclo operativo propio | [orders.service.ts](../src/attention/application/orders/orders.service.ts), [order.entity.ts](../src/attention/domain/entities/order.entity.ts) | Tabla `orders` y `order_items.order_id`; `OrderStatus` operativo calculado desde los ítems; cancelar una orden completa sin tocar la atención; rutas `/orders` y `/api/v1/attentions` | — |
| 31 | ⏳ Pendiente | 🟡 Media | Docs | Consolidar las observaciones de revisión del modelo en el SQL general, el diagrama de entidades y el documento definitivo de tablas, y recalcular el conteo total | `docs/modelo-tablas/` | Hacerlo al terminar la revisión completa del modelo, no por cada observación | Bajo |
| 28 | 🆕 Nuevo | 🟢 Baja | Funcionalidad | La API no permite vincular un gasto a una compra de inventario (`expenses.inventory_movement_id`) | `finance` + `inventory` | Aceptar `inventoryMovementId` validando que sea un `PURCHASE` de la misma sede, o crear el gasto automáticamente al registrar la compra | Medio |

## Pendientes por prioridad

| Prioridad | Puntos |
|---|---|
| 🔴 Crítica | 1, 2, 3, 5, 6 |
| 🟠 Alta | 8, 9, 12 |
| 🟡 Media | 18, 25, 31 |
| 🟢 Baja | 23, 24, 28 |

## Orden sugerido

1. **1, 2, 3 y 25**: concurrencia y consistencia en `attention`; los cuatro cambios están en el mismo código.
2. **6**: esfuerzo bajo.
3. **5**: permisos y alcance por membresía; ya es viable porque la sesión es obligatoria.
4. **8 y 9**: migraciones y seeds antes de cualquier ambiente compartido.
5. **12**: tests en el repo.
6. **18**: pagos; desbloquea el cierre de atenciones y las ventas del cierre diario.
