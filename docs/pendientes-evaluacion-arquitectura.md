# Pendientes de la evaluación de arquitectura (SOLID · Hexagonal · DDD)

Acciones que salen de la evaluación de la arquitectura del 2026-11-01, ordenadas de más crítica a menos relevante. Complementa [pendientes-arquitectura.md](pendientes-arquitectura.md); cuando un punto ya existe allí se indica su número.

**Notas actuales:** Hexagonal 8/10 · SOLID 7/10 · DDD táctico 6/10 · DDD estratégico 6.5/10

| Leyenda | |
|---|---|
| 🔴 Crítica | Riesgo de seguridad o de inconsistencia de datos |
| 🟠 Alta | Debilita el modelo o el acoplamiento; conviene resolverlo antes de seguir creciendo |
| 🟡 Media | Mejora clara de diseño, sin riesgo inmediato |
| 🟢 Baja | Higiene y convenciones |

## Resumen

| # | Prioridad | Área | Pendiente | Esfuerzo |
|---|---|---|---|---|
| A1 | ✅ Hecho | Seguridad / Aplicación | Actor y tenant explícitos en los casos de uso (va con el #5) | — |
| A2 | ✅ Hecho | DDD táctico | `Order` como raíz de agregado con sus `OrderItem` | — |
| A3 | ✅ Hecho | DDD estratégico | Romper dependencias circulares entre contextos | — |
| A4 | ✅ Hecho | DDD táctico | Value Object `Money` | — |
| A5 | ✅ Hecho | Tests | Tests unitarios del dominio (amplía el #12) | — |
| A6 | ✅ Hecho | DDD estratégico | API pública por contexto + regla de lint de límites | — |
| A7 | ✅ Hecho | SOLID (SRP) | Dividir los servicios de aplicación grandes en casos de uso | — |
| A8 | ✅ Hecho | DDD táctico | Mover lógica de negocio de la aplicación al dominio | — |
| A9 | ✅ Hecho | DDD táctico | Usar los Value Objects existentes dentro de las entidades | — |
| A10 | ✅ Hecho | DDD táctico | Revisar el agregado `Attention` (fulfillment y participantes) | — |
| A11 | ✅ Hecho | Hexagonal | Puerto `TokenIssuer` y sacar `ConfigService` de la aplicación | — |
| A12 | ✅ Hecho | Hexagonal | Quitar `@ManyToOne` hacia ORM de otros contextos | — |
| A13 | ✅ Hecho | Hexagonal | Desacoplar los DTO HTTP de las entradas de los casos de uso | — |
| A14 | ✅ Hecho | Estructura | Reordenar `common/` dentro de las capas | — |
| A15 | ✅ Hecho | DDD estratégico | Puerto único `TenantLookup` en lugar de un adaptador por contexto | — |

---

## 🔴 Crítica

### A1. Actor y tenant explícitos en los casos de uso

- **Problema:** cualquier usuario con sesión opera cualquier organización o sede (#5). Además, los servicios de aplicación no reciben quién ejecuta la acción ni en qué tenant, así que un guard HTTP solo no basta: los casos de uso que se invocan entre contextos quedarían sin protección.
- **Dónde:** todos los servicios de `*/application/`, los controllers y [auth.guard.ts](../src/iam/infrastructure/http/guards/auth.guard.ts).
- **Qué hacer:**
  1. Definir `ActorContext` en `common/application` (`userId`, `organizationId`, `restaurantIds`, `permissions`).
  2. Resolverlo en el guard a partir de la membresía y pasarlo a cada caso de uso como primer parámetro.
  3. Agregar `@RequirePermission(...)` en los controllers y validar el alcance (`canAccessRestaurant()`) dentro del caso de uso.
  4. Cargar los permisos base con un seed (#9).
- **Listo cuando:** un usuario de la organización A recibe 403 al operar recursos de la organización B, y hay un test e2e que lo comprueba.
- **✅ Hecho (2026-11-01).** Detalle completo en [autorizacion.md](autorizacion.md).
  - **Política** (decidida con el usuario): permisos `.read`/`.manage` por 10 áreas; las consultas de operación solo exigen membresía y las sensibles (pagos, finanzas, personal) su `.read`; roles base OWNER, ADMIN, CASHIER, WAITER y KITCHEN.
  - **Mecanismo:** `Actor` y la regla en [common/domain/access.ts](../src/common/domain/access.ts); IAM lo construye desde las membresías activas ([membership-actor-resolver.ts](../src/iam/infrastructure/security/membership-actor-resolver.ts)); cada ruta declara `@Authorize(permiso, scope)` o `@Authenticated()` y el `AuthorizationGuard` global niega por defecto. El tenant sale del body, la query o un recurso del path, que cada contexto sabe resolver (`*ScopeResolvers`).
  - **Decisión de diseño:** la autorización se declara por ruta y se aplica en un guard, en lugar de pasar el actor como parámetro a cada caso de uso (eran ~200 rutas y los mismos servicios los usan flujos sin actor, como el comensal o los eventos). Los casos de uso siguen validando la coherencia de los ids que reciben.
  - **Seeds (#9):** el catálogo de permisos se asegura al arrancar; cada organización nueva recibe los roles base por el evento `OrganizationCreated` (el registro del dueño ya no crea el OWNER a mano); la migración `AccessCatalog` los crea para las organizaciones existentes.
  - **Cambios de comportamiento de la API:** los listados exigen sede u organización (400 `TENANT_SCOPE_REQUIRED`); `GET /organizations` devuelve solo las del usuario; `POST /organizations` y la administración de `/users` y `/permissions` quedan para administradores de plataforma.
  - **Tests:** spec de `Actor`, e2e por HTTP ([authorization.e2e-spec.ts](../test/access/authorization.e2e-spec.ts): otra organización, alcance por sede, mozo, caja, lecturas sensibles, listado de organizaciones) y un test que recorre todas las rutas y falla si alguna no declara política o usa un recurso sin resolver.
  - **Límites conocidos:** el `Actor` se lee de la base en cada request (una consulta; cachearlo es una optimización pendiente); un miembro limitado a algunas sedes puede consultar datos de nivel organización (categorías, insumos maestros) pero no administrar roles ni membresías, que se autorizan a nivel organización.

### A2. `Order` como raíz de agregado con sus `OrderItem`

- **Problema:** `Order` y `OrderItem` tienen repositorios separados. La regla "el estado de la orden se deriva de sus ítems" la coordina el servicio, y `lock()` y `syncStatus()` existen para que otros servicios recuerden mantener la consistencia. Si un flujo nuevo se olvida de llamarlos, la orden queda con un estado incorrecto.
- **Dónde:** [orders.service.ts](../src/attention/application/orders/orders.service.ts), [order-items.service.ts](../src/attention/application/order-items/order-items.service.ts), [order.entity.ts](../src/attention/domain/entities/order.entity.ts), [order-item.entity.ts](../src/attention/domain/entities/order-item.entity.ts).
- **Qué hacer:**
  1. Que `Order` contenga sus `OrderItem` y exponga `order.cancel(...)` y `order.changeItemStatus(itemId, status)`, que recalculan el estado internamente.
  2. Que `OrderRepository.save()` persista la raíz, los ítems y el historial en una sola operación, con versión optimista sobre la raíz.
  3. Eliminar `OrderItemRepository` como punto de escritura (puede quedar un repositorio de lectura para el tablero de cocina).
  4. Eliminar `lock()` y `syncStatus()` de `OrdersService`.
- **Listo cuando:** ningún servicio modifica un `OrderItem` sin pasar por `Order`, y `order.entity.spec.ts` cubre la derivación de estados.
- **✅ Hecho (2026-11-01):**
  - `Order` contiene sus ítems y expone `submit` (con sus líneas), `changeItemStatus` y `cancel`; deriva su estado internamente. Las reglas de versión obsoleta, ítem pagado, ítem de otra orden y orden vacía viven en el agregado.
  - `OrderRepository` carga y guarda el agregado: inserta los ítems nuevos, actualiza los cambiados con chequeo de versión (`StaleOrderItemVersionError` revierte la transacción) e inserta el historial. `OrderItemRepository` y el repositorio de historial quedan solo para lectura (tablero de cocina, cuenta, historial).
  - Se eliminó `OrderStatusSyncService`; los tres casos de uso que escribían ítems (enviar, cancelar orden, cambiar estado) pasan por el agregado.
  - Tests: `order.entity.spec.ts` reescrito (18 tests) y dos e2e nuevos (cambios concurrentes de ítems hermanos, versión obsoleta e historial; cancelación de una orden completa).
  - **Pendiente:** `Attention` todavía guarda su fulfillment con un repositorio aparte (ver A10).

---

## 🟠 Alta

### A3. Romper dependencias circulares entre contextos

- **Problema:** `attention ↔ payments` usa `forwardRef`; además están `catalog → attention`, `organizations → attention` y `attention → inventory`. Los ciclos indican límites mal resueltos e impiden separar contextos.
- **Dónde:** [attention.module.ts](../src/attention/attention.module.ts), [payments.module.ts](../src/payments/payments.module.ts), [catalog.module.ts](../src/catalog/catalog.module.ts), [organizations.module.ts](../src/organizations/organizations.module.ts).
- **Qué hacer:**
  1. Introducir un `DomainEventBus` dentro del proceso (puerto en `common/application`, adaptador en `common/infrastructure`), con publicación al confirmar la transacción. Más adelante puede evolucionar a outbox.
  2. Reemplazar llamadas directas por eventos:
     - `OrderItemStatusChanged` (a `PREPARING`) → inventory registra el consumo.
     - `PaymentRegistered` → attention actualiza el saldo; finance lo considera en el cierre.
  3. Mover `service-types` y `workflow-statuses` a donde dependan de ellos sin ciclo, o exponerlos mediante un puerto del lado consumidor.
- **Listo cuando:** no queda ningún `forwardRef` entre módulos de contexto y el grafo de módulos es acíclico.
- **✅ Hecho (2026-11-01):**
  - **Bus de eventos de dominio:** `DomainEvent` en [domain-event.ts](../src/common/domain/domain-event.ts), puerto `EventBus` en [event-bus.port.ts](../src/common/application/ports/event-bus.port.ts) y `InProcessEventBus` en [events/](../src/common/infrastructure/events) (módulo global). Es síncrono: con `tx` los handlers corren dentro de la transacción del publicador; sin `tx` se publica después del commit. Los eventos viven en `<contexto>/domain/events/` y los suscriptores en `<contexto>/infrastructure/events/`.
  - **`organizations → attention` eliminado:** `RestaurantsService` publica `RestaurantCreated` dentro de su transacción y [restaurant-created.listener.ts](../src/attention/infrastructure/events/restaurant-created.listener.ts) crea los estados y modalidades por defecto. Se borraron `RestaurantSetupPort` y su adaptador; `OrganizationsModule` ya no importa `AttentionSettingsModule`.
  - **`attention → inventory` eliminado:** `OrderItemsService` publica `OrderItemPreparationStarted` después del commit y [order-item-preparation-started.listener.ts](../src/inventory/infrastructure/events/order-item-preparation-started.listener.ts) descuenta la receta; el manejo de fallos (loguear sin bloquear la cocina) pasó a inventory. Se borraron `StockConsumptionPort` y su adaptador.
  - **`attention ↔ payments` sin `forwardRef`:** la lectura de pagos se separó en [payments-ledger.module.ts](../src/payments/payments-ledger.module.ts), sin dependencias de otros módulos. Attention y finance importan ese módulo; `PaymentsModule` depende de `AttentionModule` en una sola dirección.
  - **Verificación:** 49 tests unitarios (5 nuevos para el bus y el listener) y las suites e2e `configurable-catalogs`, `entities` y `migrations` en verde. `app.e2e-spec.ts` sigue fallando como antes (#24; además, la base de desarrollo no tiene corrida la migración `ConfigurableCatalogs`).
- **Queda fuera (ciclos solo a nivel de contexto, no de módulos):**
  - `catalog ↔ attention`: catalog consulta las modalidades (`ServiceTypeLookupPort`) para validar el carrito y attention consulta productos. Resolverlo implica decidir si las modalidades pertenecen a `organizations` (configuración de la sede) en lugar de a attention.
  - `organizations ↔ iam`: organizations consulta usuarios (`IdentityModule`) e iam aprovisiona organizaciones en el registro del propietario. La separación `IdentityModule`/`IamModule` evita el ciclo de módulos; se revisa junto con A1.

### A4. Value Object `Money`

- **Problema:** los montos son `number` y se redondean con `roundMoney()` en 12 archivos. En pagos y cierres eso arrastra errores de punto flotante y permite mezclar monedas.
- **Dónde:** [money.ts](../src/common/domain/value-objects/money.ts), `allocation-planner.ts`, `attentions.service.ts` (`billFor`), `order-item.entity.ts`, `payment.entity.ts`, finance.
- **Qué hacer:** crear `Money` inmutable (montos en centavos enteros, con `currency`), con `add`, `subtract`, `multiply`, `allocate`, `isZero`, `equals`. Adoptarlo primero en payments y en el cálculo de la cuenta; luego en el resto.
- **Listo cuando:** `roundMoney` ya no se usa fuera del mapper de persistencia.
- **✅ Hecho (2026-11-01):**
  - [money.ts](../src/common/domain/value-objects/money.ts): `Money` inmutable en céntimos enteros, con `of`, `fromCents`, `parse` (valores NUMERIC del driver; null = 0), `sum`, `plus`, `minus`, `times`, `atLeastZero`, `min` y comparaciones. Tiene spec.
  - Toda la aritmética de dinero pasa por `Money`: la cuenta (`computeBill`), las líneas de cobro y el saldo de payments, el planificador de asignaciones (sus `toCents`/`fromCents` ahora delegan en `Money`), el subtotal del ítem, la validación del carrito, el gasto, el cierre diario y los totales que leen los repositorios. `roundMoney` se eliminó.
  - **Corrección de redondeo:** `Math.round(x * 100)` redondeaba mal los medios céntimos (`1.005 * 100 = 100.4999…` → 1.00). `Money` normaliza a 15 dígitos significativos antes de redondear, así que 1.005 → 1.01 y 2.675 → 2.68. Con montos de dos decimales, que es lo que permite la base, los resultados no cambian.
  - **Decisiones:**
    - Las props y getters de las entidades siguen en `number` (ya normalizados a céntimos), para no tocar mappers ni DTOs; `Money` se usa para calcular.
    - `Money` no lleva moneda: todos los montos de una atención, pago o cierre están en la moneda de su sede, que viaja aparte (`payments.currency_code`). Si algún día se mezclan monedas, agregarla al VO es el paso siguiente.

### A5. Tests unitarios del dominio

- **Problema:** hay 11 archivos de spec frente a una lógica de dominio rica. El dominio es puro: es lo más barato de testear y hoy está casi sin cobertura (#12).
- **Qué hacer:** specs para las máquinas de estado (`Attention`, `OrderItem`, `Fulfillment`, `Payment`), `StatusCatalog`, `RestaurantSupply` y los Value Objects. Pasar el smoke test al repo como e2e y arreglar `app.e2e-spec.ts` (#24).
- **Listo cuando:** cada entidad con transiciones tiene un spec y `npm test` corre en CI.
- **✅ Hecho (2026-11-01):**
  - 34 archivos de spec y 372 tests unitarios (antes: 7 archivos y 44 tests). Hay specs para todas las entidades con transiciones o reglas: `Attention`, `OrderItem`, `Order`, `Fulfillment`, `Payment`, `ProviderEvent`, `StatusCatalog`, `WorkflowStatus`, `ServiceType`, `Product`, `Menu`, `ProductRecipe`, `RestaurantSupply`, `DiningTable`, `Employee`, `Restaurant`, `Organization`, `User`, `OrganizationMembership`, `RefreshToken`, `PasswordResetToken`, `Expense` y `DailyClosure`. También para los servicios de dominio y los VOs (`Money`).
  - `test/app.e2e-spec.ts` compila y corre sobre una base desechable con todas las migraciones, como los demás e2e (#24): 4 suites e2e y 30 tests en verde. El typecheck ya no tiene excepciones.
  - **Bugs que destaparon los tests (corregidos, con test de regresión):**
    - `Menu.update`, `Employee.update` y `ServiceType.configure` escribían los cambios antes de validarlos: si la validación fallaba, el objeto quedaba modificado. Ahora aplican los cambios sobre una copia y solo la adoptan si es válida.
    - `Product` aceptaba `NaN`/`Infinity` como precio y no lo redondeaba a céntimos; `OrderItem.create` no validaba el precio unitario (con -5 × 2 daba subtotal -10).
    - `Attention.close` comparaba el saldo con `!== 0`; ahora compara en céntimos con `Money`.
  - **Diferencias con lo esperado, documentadas en los tests:** `OrderItem.changeStatus` no incrementa `version` (lo hace el repositorio con su `UPDATE … WHERE version = :expected`), y las aserciones de estado canónico lanzan `Error` genérico, no un error de dominio.
  - **Falta:** el smoke test de 98 chequeos del #12 sigue fuera del repo, y no hay CI configurado que corra `npm test`.

---

## 🟡 Media

### A6. API pública por contexto + regla de lint de límites

- **Problema:** cualquier archivo puede importar cualquier cosa de otro contexto: servicios concretos, errores, entidades de ORM. Los adaptadores capturan errores ajenos con `instanceof DiningTableNotFoundError`.
- **Qué hacer:** cada contexto expone una fachada (`<contexto>/public-api.ts`) con los servicios de consulta y los tipos que ofrece. Los adaptadores `internal-*` importan solo de ahí. Agregar `dependency-cruiser` (o `no-restricted-imports`) que prohíba importar `domain/`, `application/` o `infrastructure/` de otro contexto.
- **Listo cuando:** la regla de lint pasa en CI.
- **✅ Hecho (2026-11-01):**
  - `public-api.ts` en los contextos que otros consumen: [organizations](../src/organizations/public-api.ts), [catalog](../src/catalog/public-api.ts), [attention](../src/attention/public-api.ts), [iam](../src/iam/public-api.ts) y [payments](../src/payments/public-api.ts). Exportan solo lo que hoy se usa desde afuera (servicios, errores que capturan los adaptadores y eventos). Los 18 adaptadores y listeners `internal-*` importan solo de ahí.
  - Regla `no-restricted-imports` por contexto en [.oxlintrc.json](../.oxlintrc.json) (más una para `common`, que no puede depender de ningún contexto). Prohíbe `domain/`, `application/` e `infrastructure/` de otro contexto y permite `public-api.js`, `*.module.js` (cableado de Nest) y, hasta A12, `infrastructure/persistence/typeorm/entities/`. Se comprobó con un archivo de prueba: marca las 4 violaciones y deja pasar las 3 excepciones.
  - **Límites conocidos:** oxlint ignora en silencio los patrones con lookahead, así que la excepción de ORM se escribe como `infrastructure/([^p]|persistence/([^t]|typeorm/[^e]))`; una carpeta nueva bajo `infrastructure/` que empiece con `p` no quedaría cubierta. Además, la API pública exporta servicios completos: un contexto podría llamar comandos de otro. Reducirla a fachadas de solo lectura queda para cuando se haga A1.

### A7. Dividir los servicios de aplicación grandes

- **Problema:** `PaymentsService` (382 líneas), `AttentionsService` (374), `OrdersService` (368) y `AuthService` (306) reúnen entre 8 y 10 casos de uso cada uno y exponen métodos públicos solo para que otros servicios los encadenen.
- **Qué hacer:** extraer un caso de uso por clase (`SubmitOrderUseCase`, `CancelOrderUseCase`, `CloseAttentionUseCase`…). Hacerlo junto con A2, que ya elimina buena parte de la coordinación.
- **Listo cuando:** ningún servicio de aplicación supera ~200 líneas y no hay métodos públicos que existan solo para uso interno.
- **✅ Hecho (2026-11-01).** Se dividió por grupos de casos de uso cohesivos (no una clase por método), siguiendo el estilo de servicios del proyecto:
  - `AttentionsService` (374) → `AttentionOpeningService` (148), `AttentionLifecycleService` y `AttentionQueriesService` (la API de lectura que usan payments y finance).
  - `OrdersService` (368) → `OrderSubmissionService`, `OrdersService` (confirmar, cancelar, lecturas) y `OrderStatusSyncService`, que deja explícito como colaborador interno el `lock()`/`syncStatus()` que A2 eliminará.
  - `PaymentsService` (382) → `PaymentRegistrationService` (182) y `PaymentsService` (86).
  - `AuthService` (306) → `AuthService` (sesión y tokens, 189), `CustomerRegistrationService` y `PasswordsService`.
  - `CustomerAttentionsService` (308) → `DinerAttentionStartService` (primera orden) y `CustomerAttentionsService` (acciones del comensal).
  - Los "buscar o lanzar NotFound" repetidos pasaron a helpers (`requireAttention`/`lockAttention`, `requireOrder`/`lockOrder`, `requirePayment`, `requireBill`), como el `requireRestaurant` que ya existía en catalog.
  - Quedan entre 200 y 240 líneas: `RestaurantSuppliesService` (238), `WorkflowStatusesService` (224) y `OrderSubmissionService` (215).

### A8. Mover lógica de negocio de la aplicación al dominio

- **Problema:** `billFor()` (subtotal, total, saldo) vive en `AttentionsService`, y `validateItems()` aplica reglas del pedido (producto del mismo restaurante, ordenable para la modalidad) en `OrdersService`.
- **Qué hacer:** llevar el cálculo de la cuenta a un servicio de dominio `BillCalculator` (con `Money`, A4) y las reglas del pedido a una política de dominio que reciba los `ProductForOrder`.
- **✅ Hecho (2026-11-01)** (sin `Money`, que sigue en A4). Servicios de dominio puros, con specs:
  - attention: [bill.ts](../src/attention/domain/services/bill.ts) (`computeBill`), [attention-opening.ts](../src/attention/domain/services/attention-opening.ts) (`planAttentionOpening`: mesa de la misma sede, contacto y dirección según la modalidad, tipo de fulfillment y tarifa de la sede) y [orderable-products.ts](../src/attention/domain/services/orderable-products.ts) (`requireOrderableProducts`; `ProductForOrder` es ahora un alias del tipo de dominio `OrderableProduct`).
  - payments: [charge-lines.ts](../src/payments/domain/services/charge-lines.ts) (`buildChargeLines`, `summarizeBalance`, `allocationRequestFor`) y `REFUND_STATUSES_DISABLED` pasó a [status-catalog.ts](../src/payments/domain/status-catalog.ts).

### A9. Usar los Value Objects existentes dentro de las entidades

- **Problema:** `Email`, `CurrencyCode`, `TimeZone` y `GeoCoordinates` validan al construir la entidad, pero las props guardan `string` y `number`.
- **Dónde:** [restaurant.entity.ts](../src/organizations/domain/entities/restaurant.entity.ts), `user.entity.ts`, `organization.entity.ts` y similares.
- **Qué hacer:** tipar las props con los VOs y convertir a primitivos solo en los mappers de persistencia y en los DTO de respuesta.
- **✅ Hecho (2026-11-01):**
  - Las props guardan VOs: `Organization` (`CurrencyCode`, `TimeZone`), `Restaurant` (`Email`, `CurrencyCode`, `TimeZone`, `location: GeoCoordinates`), `User` (`Email`), `Expense` (`BusinessDate`) y `Fulfillment` (`location: GeoCoordinates`). Cada entidad tiene su spec.
  - Los getters públicos siguen devolviendo primitivos (`email?.value`), para no propagar el cambio a servicios, adaptadores y DTOs.
  - Los mappers reconstruyen con `X.rehydrate(...)`, que no vuelve a validar: una fila antigua no rompe una lectura.
  - **Caso borde:** una fila con solo latitud o solo longitud se lee como "sin ubicación" y, si se vuelve a guardar, se escriben ambas en null. La base valida el rango de cada coordenada, pero no que vayan juntas.
  - Fuera de alcance: `DailyClosure.businessDate` y `Payment.currencyCode` siguen como string.

### A10. Revisar el agregado `Attention`

- **Problema:** `Fulfillment` y `AttentionParticipant` tienen repositorios propios, aunque sus reglas dependen del estado de la atención (por ejemplo, no cambiar el fulfillment de una atención cerrada).
- **Qué hacer:** decidir con el mismo criterio que A2 qué entidades son internas al agregado `Attention` y cuáles son agregados independientes que se referencian por id. Documentar la decisión.
- **✅ Decisión (2026-11-01):**
  - **`Fulfillment` pertenece al límite de consistencia de `Attention`.** Es 1:1 (`uq_fulfillments_attention`), nace en la misma transacción que la atención, su tarifa forma parte de la cuenta y cancelar la atención lo cancela. La regla es que todo cambio del fulfillment bloquea primero la fila de la atención. No se exige que la atención esté activa: un delivery puede completarse después de pagada y cerrada la atención.
  - **Bug corregido:** `cancel()` leía el fulfillment fuera de la transacción y `changeFulfillmentStatus()` no bloqueaba nada. Si el personal confirmaba el delivery mientras otro cancelaba la atención, podía quedar una atención `CANCELLED` con su delivery `CONFIRMED`. Ahora ambos corren bajo el bloqueo de la atención (`FulfillmentRepository.findByAttention` acepta `tx`). El test e2e `12.` lo cubre; se comprobó que falla con el código anterior.
  - **`AttentionParticipant` queda como agregado propio**, referenciado por `attentionId`. Varios comensales se unen a la vez y meterlos en el agregado serializaría cada unión. La unicidad la garantiza la base (`uq_participants_attention_user` / `_guest`), y unirse solo ocurre en el flujo de inicio, que ya bloquea la atención.
  - **Pendiente:** que `AttentionRepository` cargue y guarde el fulfillment junto con la atención (en lugar de un repositorio aparte), cuando se haga A2 con el mismo patrón.

---

## 🟢 Baja

### A11. Puerto `TokenIssuer` y sacar `ConfigService` de la aplicación

- **Dónde:** [auth.service.ts](../src/iam/application/auth/auth.service.ts) (`JwtService`, `ConfigService`), [stock-consumption.service.ts](../src/inventory/application/stock-consumption/stock-consumption.service.ts) (`ConfigService`).
- **Qué hacer:** puerto `TokenIssuer` (firmar y verificar) con un adaptador JWT, igual que ya existe `PasswordHasher`. La configuración de negocio (por ejemplo, `INVENTORY_AUTO_CONSUMPTION`) se inyecta como un objeto de settings tipado.
- **✅ Hecho (2026-11-01):**
  - Puerto [token-issuer.port.ts](../src/iam/application/ports/token-issuer.port.ts) y adaptador [jwt-token-issuer.ts](../src/iam/infrastructure/security/jwt-token-issuer.ts), con spec (ida y vuelta, un tipo de token no sirve como el otro, expirados y malformados).
  - `AuthService` mantiene la política de duración (15 min / 30 días, que también fija el `expiresAt` del refresh token guardado); el formato y los secretos son del adaptador.
  - Inventory recibe `InventorySettings` ([inventory-settings.ts](../src/inventory/application/inventory-settings.ts)), que arma `InventoryModule` a partir de `INVENTORY_AUTO_CONSUMPTION`.
  - Ya no queda `@nestjs/config` ni `@nestjs/jwt` en `application/` ni en `domain/`, y la regla de capas de `.oxlintrc.json` lo impide (ver A13).

### A12. Quitar `@ManyToOne` hacia ORM de otros contextos

- **Problema:** `AttentionOrmEntity` y otros referencian `RestaurantOrmEntity` y `UserOrmEntity`. La persistencia acopla contextos que el dominio mantiene separados.
- **Qué hacer:** dejar solo la columna `*_id` (la FK puede seguir en la migración) y eliminar la relación de ORM y el import.
- **✅ Hecho (2026-11-01):**
  - Las 32 relaciones hacia entidades de otro contexto se reemplazaron por `@ForeignKey('XOrmEntity', { onDelete })` sobre la columna: la FK sigue en la base, pero ya no hay propiedad de relación ni `import` de la entidad ajena. Ninguna consulta navegaba esas relaciones.
  - El esquema no cambió: el e2e `migrations` (`pendingSchemaChanges` vacío) sigue en verde.
  - La `OneToOne` de `expenses.inventory_movement_id` creaba además una UNIQUE `REL_7bc3…`, redundante con `uq_expenses_inventory_movement`; se conserva con `@Unique` y su nombre exacto. **Pendiente:** borrarla en una migración.
  - Las únicas importaciones de ORM entre contextos que quedan son las de `common/infrastructure/persistence/database/entities.ts`, la raíz de composición que registra todas las entidades. La regla de límites ya no tiene excepción para ORM.

### A13. Desacoplar los DTO HTTP de las entradas de los casos de uso

- **Problema:** controllers como `productsService.create(dto)` pasan el DTO HTTP directo; el contrato del caso de uso queda definido de hecho por el DTO.
- **Qué hacer:** que cada caso de uso declare su propio tipo de entrada (como ya hace `SubmitOrderInput`) y que el controller mapee explícitamente.
- **✅ Hecho (2026-11-01).** Al revisarlo, ningún servicio de aplicación importaba DTOs: todos declaran su propio tipo de entrada, y los controllers pasan el DTO porque cumple ese tipo por estructura (el `ValidationPipe` con whitelist descarta campos extra). En lugar de agregar un mapeo explícito en cada controller, se impide que se rompa:
  - Regla de capas en [.oxlintrc.json](../.oxlintrc.json): `application/` y `domain/` no pueden importar `infrastructure/` (por lo tanto, tampoco DTOs) ni `typeorm`, `@nestjs/typeorm`, `@nestjs/config`, `@nestjs/jwt`, `@nestjs/swagger`, `class-validator`, `class-transformer` o `express`. Además, `domain/` no puede importar `application/` ni `@nestjs/common`.
  - Para cumplir la última regla, `pagination.ts` (tipos `Page`/`PageRequest` que usan los puertos de repositorio) pasó de `common/application` a [common/domain](../src/common/domain/pagination.ts).
  - Se comprobó con archivos de prueba que cada regla marca lo que debe y deja pasar `@nestjs/common` y `public-api` en `application/`.

### A14. Reordenar `common/` dentro de las capas

- **Qué hacer:** mover `common/filters`, `common/interceptors`, `common/interfaces` y `common/persistence` dentro de `common/infrastructure/` para que `common` siga la misma convención de capas que los contextos.
- **✅ Hecho (2026-11-01):** `common/` queda solo con `application/`, `domain/` e `infrastructure/`. `filters/`, `interceptors/` e `interfaces/` pasaron a `common/infrastructure/http/`, y `persistence/` a `common/infrastructure/persistence/`. Se actualizaron el script `typeorm` de `package.json` (`migration:show` funciona con la ruta nueva), los imports de `test/` y los enlaces de `pendientes-arquitectura.md` y `modelo-tablas/base-de-datos.md`.

### A15. Puerto único `TenantLookup`

- **Problema:** casi todos los contextos tienen su propio `internal-restaurant-lookup.adapter.ts` u `organization-lookup` con lógica parecida sobre `organizations`.
- **Qué hacer:** formalizar `organizations` como núcleo compartido con un único puerto `TenantLookup` (organización, sede, moneda, zona horaria) en `common/application`, implementado una vez. Hacerlo junto con A1, que necesita la misma información.

---
- **✅ Hecho (2026-11-01):**
  - Puerto compartido [tenant-lookup.port.ts](../src/common/application/ports/tenant-lookup.port.ts) (`organizationExists`, `findRestaurant`, `findRestaurantBySlug`; la sede trae organización, slug, estado, moneda y zona horaria), implementado una sola vez en [tenant-lookup.adapter.ts](../src/organizations/infrastructure/lookups/tenant-lookup.adapter.ts) y exportado por `OrganizationsModule`.
  - Reemplaza 5 puertos y 5 adaptadores casi idénticos (attention, catalog, finance, iam e inventory), con la misma semántica (no existe → `null` / `false`). Los 16 servicios que los usaban inyectan `TENANT_LOOKUP`.
  - `organizations/public-api.ts` dejó de exportar `Restaurant`, `OrganizationNotFoundError` y `RestaurantNotFoundError`, que ya nadie usa fuera.
  - **Para A1:** el puerto ya es el lugar natural para agregar el alcance por membresía.

## Orden sugerido

1. **A1 + A15:** permisos y alcance por tenant comparten la misma información; es lo único crítico de seguridad.
2. **A2 + A7:** agregado `Order` y división de `OrdersService`/`OrderItemsService` en el mismo cambio.
3. **A4 + A8:** `Money` y `BillCalculator` juntos.
4. **A3 + A6:** eventos de dominio y regla de límites; con la regla en CI no vuelven a aparecer ciclos.
5. **A5** de forma continua: cada punto anterior entra con sus tests.
6. **A9, A10** y los puntos 🟢 cuando se toque el código afectado.
