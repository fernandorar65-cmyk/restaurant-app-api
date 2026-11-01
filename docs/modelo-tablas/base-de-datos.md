# Base de datos de Restaurant CMR (ACMR)

Cómo está organizada la base de datos, qué guarda cada tabla y por qué existe.

**Estado al:** 31/10/2026 (corrección de catálogos configurables) · **Diagrama:** [modelo-bd.png](modelo-bd.png) ([SVG](modelo-bd.svg), para hacer zoom)

---

## 1. Visión general

- **Motor:** PostgreSQL 16, todas las tablas en el schema `public` (sin un schema por contexto, por decisión del proyecto).
- **53 tablas:** 50 del modelo de negocio, 2 de soporte de autenticación (`refresh_tokens`, `password_reset_tokens`) y 1 técnica (`error_logs`). 508 columnas, 90 claves foráneas, 97 checks y 161 índices.
- **8 contextos** (bounded contexts de un monolito modular). Cada uno es dueño de sus tablas y solo él escribe en ellas:

| Contexto | Tablas | Responsabilidad |
|---|---|---|
| IAM | 9 | Identidad única, roles, permisos y membresías (7 + 2 de soporte de auth) |
| Organizations | 7 | Organización, sedes, personal, salón y mesas |
| Catalog | 7 | Productos, categorías y menús |
| Attention | 9 | La visita del cliente: órdenes, platos, estados configurables y tipos de servicio |
| Payments | 9 | Cobros, asignación por producto, pasarelas y reembolsos |
| Inventory | 7 | Insumos, stock por sede y movimientos |
| Finance | 4 | Gastos y cierre diario |
| Observability | 1 | Registro de errores de la aplicación |
| **Total** | **53** | |

### Cómo se crea la base

El esquema lo crean las **migraciones versionadas** (`src/common/infrastructure/persistence/database/migrations/`, en orden en `migrations.ts`), con `npm run migration:run`. Las entidades TypeORM (`*.orm-entity.ts`) describen el mismo esquema y un test e2e comprueba que coinciden. `synchronize` está **apagado** en todos los entornos; solo se puede encender con `DB_SYNCHRONIZE=true` para una base local desechable, y nunca en producción.

| Migración | Qué hace |
|---|---|
| `1761955200000-InitialSchema` | Las 51 tablas previas. En una base creada antes por `synchronize` no hace nada: la adopta tal como está |
| `1761955300000-ConfigurableCatalogs` | Catálogos configurables, `service_types`, `reserves_balance`, `fulfillment_id` en asignaciones, FK de pagos y sin cascadas. Migra los datos existentes y verifica que no queden referencias nulas antes de borrar columnas. Tiene `down` |

Al arrancar, la app carga los **catálogos de ACMR** sin duplicar nada: estados de pago, estados de reembolso, unidades de medida y tipos de movimiento de inventario. **Al crear una sede**, en la misma transacción se crean sus estados de atención, sus estados de orden y sus tipos de servicio (seeds idempotentes por código).

### Convenciones

| Convención | Detalle |
|---|---|
| Identificadores | `id uuid` generado; las tablas puramente asociativas usan clave compuesta (por ejemplo, `role_permissions`) |
| Auditoría | `created_at` y `updated_at` (`timestamptz`). Los registros inmutables solo tienen `created_at` |
| Dinero | `numeric(12,2)` (cierres: `numeric(14,2)`); cantidades de inventario `numeric(14,3)`; costos `numeric(14,4)` |
| Nombres sin distinguir mayúsculas | Columnas `citext` cuando el nombre debe ser único ignorando mayúsculas ("Cocina" = "cocina") |
| Bajas lógicas | `is_active` o `status`: lo que tiene historial no se borra, se desactiva |
| Restricciones con nombre | `uq_*` únicas, `chk_*` checks, `idx_*` índices. La API traduce estas violaciones a errores en español |
| Estados | Del ciclo de la atención y de la orden: **catálogos por sede** (`attention_statuses`, `order_statuses`) referenciados por id. Del resto (usuarios, productos, gastos, fulfillments…): `varchar` con un `CHECK` generado desde el enum del código |
| Estados canónicos | Cada estado configurable tiene un `canonical_state` fijo que es lo único que mira el backend; la sede elige código, nombre, color y orden |
| Fechas de negocio | `date` interpretada en la zona horaria de la sede, no en UTC |

### Claves foráneas entre contextos (política)

Es un monolito modular con una sola base, así que se aplica este criterio:

1. **Dentro de un contexto:** clave foránea física siempre.
2. **Hacia Organizations e IAM** (contextos base y estables): clave foránea física. Son 27 de las 33 que cruzan contextos (16 a Organizations, 11 a IAM).
3. **Hacia otros contextos:** solo referencias estables de solo lectura: `order_items → products`, `product_recipes → products` y `expenses → inventory_movements`.
4. **Excepción consciente: Payments → Attention.** `payments.attention_id`, `payment_allocations.order_item_id` y `payment_allocations.fulfillment_id` son referencias lógicas por UUID, sin FK, para poder separar Payments más adelante. La aplicación valida su existencia y su pertenencia a la sede con el puerto de facturación de la atención, dentro del bloqueo por atención.
5. **Sin `ON DELETE CASCADE` en historia ni dinero:** atenciones, participantes, fulfillments, órdenes, platos, historial, pagos, asignaciones, reembolsos y cierres no se borran en cascada. Las cascadas que quedan son de configuración (permisos de un rol, productos de un menú, etc.).

---

## 2. IAM: identidad y acceso

Una sola identidad (`users`) para todos: la misma persona puede ser comensal, dueña de una organización y empleada de otra. Lo que puede hacer depende de sus **membresías y roles**, nunca de un "tipo de usuario".

| Tabla | Qué guarda | Por qué existe | Reglas clave |
|---|---|---|---|
| `users` | Email, hash de contraseña, nombre, teléfono, estado, último acceso | Identidad única para comensales y personal; evita cuentas duplicadas por rol | Email único (`uq_users_email`). `is_platform_admin` marca a los administradores de ACMR y solo se activa desde la base de datos, nunca por la API |
| `customer_profiles` | Preferencias del comensal (`dietary_preferences`) | Separa los datos del comensal de la identidad: no todos los usuarios son comensales | Relación 1 a 1 con `users` (la clave primaria es `user_id`) |
| `roles` | Roles por organización (OWNER, mozo, cajero…) | Cada organización define sus propios roles | Código único por organización; `is_system` marca los roles creados por el sistema |
| `permissions` | Catálogo de permisos (`code`) | Los permisos son lo que realmente habilita acciones; los roles solo los agrupan | Código único |
| `role_permissions` | Qué permisos tiene cada rol | Relación muchos a muchos entre roles y permisos | Clave compuesta (rol, permiso) |
| `organization_memberships` | Usuario + organización + rol, estado y fecha de ingreso | Vincula a una persona con una organización y define con qué rol actúa | Una membresía por usuario y organización. `all_restaurants` da acceso a todas las sedes |
| `membership_restaurants` | Sedes a las que accede una membresía | Limita el alcance cuando `all_restaurants` es falso | Clave compuesta (membresía, sede) |
| `refresh_tokens` | Hash del refresh token, vencimiento, revocación | Sesiones largas sin guardar el token en claro; permite cerrar sesión y rotar | Solo se guarda el hash; la rotación es atómica (un token usado no vuelve a servir) |
| `password_reset_tokens` | Hash del token de recuperación, vencimiento, uso | Recuperar la contraseña de forma segura | Hash único; un solo uso |

> Los permisos ya están modelados, pero la API todavía no los aplica por endpoint (pendiente C3).

---

## 3. Organizations: organización, sedes y salón

```
organizations
├── restaurants (sedes)
│   └── restaurant_floors → dining_tables (con su QR)
├── work_areas → job_positions → employees
```

| Tabla | Qué guarda | Por qué existe | Reglas clave |
|---|---|---|---|
| `organizations` | Razón social, RUC, moneda, zona horaria, estado | Es el cliente de ACMR: agrupa sedes, catálogos y personal | RUC único. La moneda y la zona horaria son los valores por defecto de sus sedes |
| `restaurants` | Datos de cada sede: código, slug, dirección, ubicación, moneda, zona horaria | Una organización puede tener varias sedes con datos y horarios propios | Código único por organización; `slug` único global (es la URL pública de la carta) |
| `restaurant_floors` | Pisos o ambientes de una sede | Ordenar las mesas por zona ("Terraza", "Piso 2") | Nombre único por sede |
| `dining_tables` | Mesa: código, capacidad, estado operativo y de servicio, posición en el plano y su QR | La mesa es el punto de entrada del comensal (escanea el QR) | Código único por sede. Del QR solo se guarda el **hash SHA-256** del token (`qr_token_hash`, único) y su versión: regenerarlo invalida el anterior. "Ocupada" no es un estado: se deduce de tener una atención activa |
| `work_areas` | Áreas de trabajo (Cocina, Sala, Limpieza) | Normalizar las áreas en lugar de texto libre | Nombre único por organización, sin distinguir mayúsculas |
| `job_positions` | Puestos (Cocinero, Mozo) dentro de un área | Normalizar los puestos y reportar por puesto | Nombre único por área, sin distinguir mayúsculas. **Un puesto nunca da permisos**: eso es IAM |
| `employees` | Empleado: código, documento, puesto, estado, fechas de ingreso y cese | Datos laborales; puede existir sin usuario (personal sin acceso al sistema) | Código único por organización; un usuario es empleado una sola vez por organización; el puesto debe ser de la misma organización |

---

## 4. Catalog: productos y menús

Las **categorías** son de la organización (se reutilizan en todas sus sedes) y se organizan en árbol. Los **productos** y **menús** son de cada sede. Una **sección de menú** es cómo se agrupan los productos en un menú concreto, y es independiente de la categoría.

| Tabla | Qué guarda | Por qué existe | Reglas clave |
|---|---|---|---|
| `categories` | Categorías de productos en árbol (`parent_category_id`) | Clasificar productos: Comidas > Carnes > Parrillas | Nombre único dentro del mismo padre, sin distinguir mayúsculas (dos índices parciales: uno para raíces y otro para hijas). Una categoría no puede ser su propio padre y la API impide ciclos |
| `products` | Plato o bebida de una sede: código, precio, tiempo de preparación, disponibilidad y modalidades permitidas | Lo que se vende. `status` es el ciclo de catálogo; `is_available` es el "agotado hoy" | Código único por sede; precio ≥ 0 |
| `product_categories` | Qué categorías tiene cada producto | Un producto puede estar en varias categorías | Clave compuesta (producto, categoría); misma organización |
| `menus` | Menús de una sede (Carta, Menú del día) con vigencia | Ofrecer distintas selecciones de productos según el momento | Nombre único por sede; la vigencia no puede terminar antes de empezar |
| `menu_sections` | Secciones visibles de un menú (Entradas, Promociones) | Ordenar la carta; el mismo producto puede ir en secciones distintas según el menú | Nombre único por menú, sin distinguir mayúsculas; puede reutilizar una categoría |
| `menu_products` | Qué productos aparecen en cada menú, en qué sección, orden y precio mostrado | Relación muchos a muchos con datos propios de la aparición | Clave compuesta (menú, producto). `display_price` es solo de exhibición: el pedido usa el precio del producto |
| `product_ingredients` | Ingredientes visibles en la carta | Informar al comensal la composición del plato (opcional) | No afecta el stock; no se usa para afirmar alérgenos (los alérgenos quedaron fuera del MVP) |

---

## 5. Attention: la visita del cliente

```
attention_statuses, order_statuses, service_types   (configuración de cada sede)
attentions (la visita / la cuenta) → attention_statuses, service_types
├── attention_participants (comensales en la mesa)
├── fulfillments (datos de recojo o delivery)
└── orders (cada comanda o ronda) → order_statuses
    └── order_items (cada plato) → order_statuses
        └── order_item_status_history → order_statuses (anterior y nuevo)
```

Los ciclos están separados: la **atención** tiene el ciclo comercial y la **orden** (y cada plato) el ciclo operativo. Servir o cancelar una orden nunca cierra la atención.

**Estados configurables.** Cada sede tiene su propio catálogo de estados para cada ciclo. Puede renombrarlos, darles color, reordenarlos y agregar estados propios (por ejemplo "En horno" dentro de *en preparación*), pero cada uno pertenece a un **estado canónico** fijo, y el backend decide solo con ese valor:

| Ciclo | Estados canónicos | Inicial | Finales |
|---|---|---|---|
| Atención | `OPEN`, `BILL_REQUESTED`, `CLOSED`, `CANCELLED` | `OPEN` | `CLOSED`, `CANCELLED` |
| Orden y plato | `SUBMITTED`, `CONFIRMED`, `IN_PREPARATION`, `READY`, `SERVED`, `REJECTED`, `CANCELLED` | `SUBMITTED` | `SERVED`, `REJECTED`, `CANCELLED` |

No hay `DRAFT`: el carrito vive en el cliente hasta que se envía. `CONFIRMED` solo lo usan las órdenes y `REJECTED` solo los platos. Cuando el backend mueve algo por su cuenta (pedir la cuenta, el estado de una orden calculado desde sus platos), usa el primer estado activo de ese estado canónico según `sort_order`.

**Tipos de servicio.** `service_types` reemplaza a `restaurant_order_modes`: la sede nombra y ordena sus modalidades, y puede tener varias del mismo tipo (por ejemplo "Delivery propio" y "Delivery por app"). Las reglas salen de `fulfillment_mode` (`DINE_IN`, `PICKUP`, `DELIVERY`) y de `requires_table` / `requires_customer_address`.

| Tabla | Qué guarda | Por qué existe | Reglas clave |
|---|---|---|---|
| `attention_statuses` | Estados comerciales de la sede: código, nombre, estado canónico, color, orden, inicial, final, activo | Cada restaurante muestra y ordena sus estados a su manera | Código único por sede; **un solo estado inicial activo por sede** (`uq_attention_statuses_initial`), y debe ser `OPEN`; `is_final` sigue al estado canónico. Un estado usado no se borra, se desactiva; no se puede desactivar el inicial ni el último activo de su estado canónico |
| `order_statuses` | Estados operativos de órdenes y platos de la sede, con los mismos campos | Que cada cocina tenga su propio flujo visible sin romper las reglas | Igual que `attention_statuses`; el inicial debe ser `SUBMITTED` |
| `service_types` | Tipos de servicio de la sede: código, nombre, modalidad, si exige mesa o dirección, monto mínimo, costo de envío, orden, activo | La sede decide cómo atiende y en qué condiciones | Código único por sede; monto mínimo y envío ≥ 0; solo `DINE_IN` puede exigir mesa y solo `DELIVERY` dirección. Se crean `DINE_IN` (activo), `PICKUP` y `DELIVERY` (inactivos) al crear la sede. Un tipo usado se desactiva, no se borra |
| `attentions` | Atención: sede, mesa (si aplica), tipo de servicio, número visible, estado y fechas | Agrupa todo lo que ocurre en una visita: órdenes, cuenta y pagos | **Una sola atención activa por mesa** (`uq_attentions_active_table`: activa = sin `closed_at` ni `cancelled_at`, que el dominio siempre llena al cerrar o cancelar); número único por sede; mesa obligatoria si el tipo la exige; `version` para concurrencia |
| `attention_participants` | Quién participa: usuario logueado o invitado (`guest_token`) | Varios comensales comparten una atención; solo los participantes pueden verla | Un usuario o un invitado aparece una sola vez por atención |
| `fulfillments` | Datos de recojo o delivery: contacto, dirección, costo de envío, estado y tiempos | Lo que no existe en una atención en mesa | Una por atención; dirección obligatoria si el tipo de servicio la exige; el costo de envío lo pone el tipo de servicio, nunca el cliente; flujo de estados propio (`varchar` + `CHECK`) |
| `orders` | Cada comanda o ronda: origen (comensal o mozo), quién la envió, estado operativo (`order_status_id`) | Una atención recibe varios pedidos a lo largo de la visita (bebidas, fondos, postres) | `request_id` único por atención: reenviar la misma orden no duplica platos. El estado se recalcula a partir de sus platos |
| `order_items` | Cada plato: producto, **nombre y precio congelados**, cantidad, subtotal, nota y estado (`order_status_id`) | La unidad que prepara la cocina y que se cobra | Precio, cantidad y subtotal válidos; el estado debe ser de la misma sede; `REJECTED` exige motivo; `version` evita que dos empleados se pisen al cambiar el estado |
| `order_item_status_history` | Cada cambio de estado de un plato: estado anterior y nuevo (`previous_status_id`, `new_status_id`), quién, motivo | Auditoría del flujo de cocina y de rechazos o cancelaciones | Solo inserción. Sin copia del nombre: los estados nunca se borran, así que el id siempre lleva a un código y nombre legibles |

> Se congelan el nombre y el precio del producto al pedir para que cambios posteriores del catálogo no alteren pedidos ya hechos.

---

## 6. Payments: cobros independientes de la pasarela

```
payment_statuses ← payments → payment_allocations (por plato o envío)
                      ↑
payment_provider_status_mappings / payment_provider_events
refund_statuses ← refunds → refund_allocations   (modelado, sin flujo todavía)
```

| Tabla | Qué guarda | Por qué existe | Reglas clave |
|---|---|---|---|
| `payment_statuses` | Catálogo global de estados internos (PENDING, PAID, FAILED…) con `counts_toward_balance`, `reserves_balance`, `is_terminal` y `allows_refund` | El dominio nunca depende de los estados de una pasarela; el efecto contable de cada estado es explícito | Código único en mayúsculas. Un estado no puede contar y reservar a la vez. Lo administra ACMR: solo se cambian nombres, el efecto está fijo en el código |
| `payments` | Cada movimiento de dinero o intento de cobro: monto, método, modo de asignación, pagador, datos de la pasarela | Saber cuánto, cómo, quién y con qué resultado se cobró | Monto > 0. `request_id` único por sede (idempotencia). Id de la pasarela único por proveedor. `provider_status` guarda el estado **original** del proveedor. El monto nunca cambia después. FK a organización, sede y usuarios; la atención es referencia lógica |
| `payment_allocations` | Cómo se reparte cada pago entre los platos o el costo de envío | Saber qué quedó pagado y cuánto falta por plato; un pago cubre varios platos y un plato puede pagarse con varios pagos | Monto > 0. **Exactamente un destino** (`chk_allocations_target`): `ORDER_ITEM` con `order_item_id`, o `DELIVERY_FEE` con `fulfillment_id`, nunca ambos ni ninguno. Un plato una vez por pago y un envío por pago. La suma es igual al monto del pago (lo valida el servicio en la transacción) |
| `payment_provider_status_mappings` | Traducción de estados de cada pasarela a internos (`mercado_pago` + `approved` → PAID) | Integrar pasarelas distintas sin cambiar el dominio | Único por proveedor y estado externo, sin distinguir mayúsculas |
| `payment_provider_events` | Cada evento o webhook recibido: payload, resultado del procesamiento | Auditoría de la pasarela y procesamiento idempotente | Único por proveedor y `event_id`: un webhook repetido no se reaplica. Los datos de tarjeta se eliminan del payload antes de guardarlo |
| `refund_statuses` | Catálogo de estados de reembolso (PENDING… SUCCEEDED) | El reembolso tiene un ciclo distinto al pago | Igual que `payment_statuses` |
| `refunds` | Reembolsos de un pago | Devolver dinero sin editar ni borrar el pago original | **Modelado, aún no habilitado**: sin flujo ni endpoints públicos (decisión pendiente N1) |
| `refund_allocations` | Qué parte de cada asignación devuelve un reembolso | Restaurar el saldo por plato en reembolsos parciales | Modelado, aún no habilitado |
| `refund_provider_status_mappings` | Traducción de estados de reembolso por pasarela | Igual que los mapeos de pago | Modelado, aún no habilitado |

> **Pagos pendientes.** El efecto de cada estado es explícito: `counts_toward_balance` = ya reduce la deuda confirmada; `reserves_balance` = todavía no está confirmado, pero bloquea ese monto para evitar cobros duplicados. Decisión vigente: `PENDING` y `PROCESSING` reservan; `PAID`, `PARTIALLY_REFUNDED` y `REFUNDED` cuentan; `FAILED` y `CANCELLED` no hacen ninguna de las dos cosas. El saldo disponible = total − confirmado − reservado, y se calcula bajo un bloqueo por atención (advisory lock), así que dos cobros simultáneos nunca superan la deuda.

---

## 7. Inventory: insumos, stock por sede y movimientos

```
units_of_measure, inventory_movement_types (catálogos ACMR)
inventory_categories → supplies (maestro de la organización)
                          └── restaurant_supplies (stock de cada sede)
                                  └── inventory_movements (historial inmutable)
product_recipes (producto → insumo maestro)
```

| Tabla | Qué guarda | Por qué existe | Reglas clave |
|---|---|---|---|
| `units_of_measure` | Unidades (KG, G, L, ML, UNIT) con dimensión y factor de conversión | Evitar unidades en texto libre ("kg", "kilo", "kilogramo") | Catálogo de ACMR; factor > 0 |
| `inventory_movement_types` | Tipos de movimiento con su efecto (INCREASE, DECREASE, CALCULATED) | Que cada movimiento diga sin ambigüedad si suma o resta | Catálogo de ACMR; no existe un `ADJUSTMENT` ambiguo, cada ajuste dice si entra o sale |
| `inventory_categories` | Categorías de insumos (Carnes, Verduras, Limpieza) | Agrupar insumos para todas las sedes | Nombre único por organización, sin distinguir mayúsculas |
| `supplies` | Insumo maestro: código, nombre, categoría, unidad base | Registrar cada insumo **una sola vez por organización**, sin duplicar "Arroz" por sede | Código único por organización. No guarda stock. La unidad no cambia si ya hay movimientos |
| `restaurant_supplies` | Stock de un insumo en una sede: saldo, mínimo, costo promedio | Cada sede tiene saldos, mínimos y costos distintos del mismo insumo | Una fila por sede e insumo; saldo, mínimo y costo ≥ 0. **El saldo solo cambia con un movimiento** en la misma transacción |
| `inventory_movements` | Cada entrada o salida: `quantity_delta` firmado, saldo anterior y resultante, costo, origen, autor | Saber por qué cambió el stock, quién lo hizo y desde dónde | Inmutable: los errores se corrigen con una reversión (una por movimiento). Se cumple `resultante = anterior + delta` y el delta nunca es 0. `idempotency_key` única por stock. `sequence` da el orden exacto: el último movimiento tiene el saldo actual |
| `product_recipes` | Cuánto de cada insumo maestro usa una unidad de producto, con merma | Base para descontar stock automáticamente al preparar | Cantidad > 0; merma entre 0 y 100 %. El descuento automático está **apagado** (`INVENTORY_AUTO_CONSUMPTION=false`) |

---

## 8. Finance: gastos y cierre diario

| Tabla | Qué guarda | Por qué existe | Reglas clave |
|---|---|---|---|
| `expense_categories` | Categorías de gasto (Alquiler, Servicios) | Reportar gastos por concepto sin depender de textos libres | Nombre único por organización; baja lógica |
| `expenses` | Cada egreso real de una sede: categoría, monto, fecha, método de pago, estado | Controlar la salida de dinero sin mezclarla con ventas ni con stock | Monto > 0; un gasto por movimiento de inventario (`inventory_movement_id` opcional). No se borra: se **anula** (`VOIDED`) y deja de contar |
| `daily_closures` | Foto del día de una sede: atenciones, ventas, reembolsos, gastos, efectivo esperado y contado, diferencia, responsable | Conciliar la caja y consultar resultados históricos sin recalcular | **Uno por sede y fecha**. Calculado desde las tablas de origen; el usuario solo ingresa el efectivo contado y notas. No se edita |
| `daily_closure_payment_totals` | Lo cobrado en el cierre por método de pago | Conciliar efectivo, depósitos digitales y pasarelas | Clave compuesta (cierre, método); se guarda en la misma transacción que el cierre |

> El MVP tiene un solo cierre por sede y fecha: no hay cajas, cajeros ni turnos. Ver [finanzas-pendientes.md](../finanzas-pendientes.md).

---

## 9. Observability

| Tabla | Qué guarda | Por qué existe | Reglas clave |
|---|---|---|---|
| `error_logs` | Errores de la aplicación: nivel, origen, mensaje, stack, request, ruta, código HTTP, `errorCode`, usuario | Investigar fallas en producción sin depender de la consola | Sin claves foráneas a propósito: un log debe poder escribirse aunque los datos relacionados estén inconsistentes. Se borran automáticamente después de `ERROR_LOG_RETENTION_DAYS` días |

---

## 10. Flujos completos

### Pedido en mesa hasta el pago
1. El comensal escanea el QR. La API compara el hash del token con `dining_tables.qr_token_hash`.
2. Se abre una `attentions` con el tipo de servicio en mesa de la sede y su estado inicial (o se usa la activa de la mesa), y el comensal queda como participante.
3. Cada envío del carrito crea una `orders` con sus `order_items`, que guardan el nombre y el precio del momento.
4. La cocina avanza cada plato por los estados de su sede; cada cambio queda en `order_item_status_history` y recalcula el estado de la orden.
5. Al cobrar se crea un `payments` con sus `payment_allocations` por plato y, en delivery, por el envío de su `fulfillment`.
6. Con saldo 0, la atención se cierra.

### Compra de insumos
1. Se registra un movimiento `PURCHASE` en `inventory_movements`, que sube `restaurant_supplies.current_quantity` y recalcula el costo promedio.
2. El egreso se registra en `expenses`, que puede apuntar a ese movimiento (la API todavía no expone el vínculo: pendiente F2).

### Cierre del día
`daily_closures` se calcula a partir de `attentions` (cantidades), `payments` y `refunds` confirmados (ventas por método) y `expenses` registrados. Se guarda junto con `daily_closure_payment_totals` en una sola transacción.

---

## 11. Cómo la base protege la consistencia

| Riesgo | Mecanismo |
|---|---|
| Dos atenciones activas en la misma mesa | Índice único parcial `uq_attentions_active_table` |
| Dos estados iniciales en una sede | Índices únicos parciales `uq_attention_statuses_initial` y `uq_order_statuses_initial` |
| Usar un estado o tipo de servicio de otra sede | El servicio solo acepta estados activos de la sede del registro |
| Un pago asignado a un plato y al envío a la vez | `chk_allocations_target` |
| Borrar historia o dinero en cascada | Ninguna FK de historia o dinero tiene `ON DELETE CASCADE` |
| Pedidos, pagos o movimientos duplicados por reintentos | Claves de idempotencia únicas: `orders.request_id`, `payments.request_id`, `inventory_movements.idempotency_key`, `payment_provider_events.event_id` |
| Dos empleados cambiando el mismo plato | Columna `version` (bloqueo optimista) en `order_items` |
| Stock pisado por movimientos simultáneos | Bloqueo de la fila de `restaurant_supplies` en la transacción |
| Cobrar más que la deuda en paralelo | Bloqueo por atención (advisory lock) al recalcular el saldo |
| Saldos de inventario incoherentes | `CHECK resulting_quantity = previous_quantity + quantity_delta` |
| Valores fuera de rango | 97 checks: montos ≥ 0 o > 0 según el caso, estados canónicos, porcentajes, fechas coherentes |
| Tokens filtrados de la base | Solo se guardan hashes: QR, refresh tokens y recuperación de contraseña |

---

## 12. Limitaciones conocidas

- Todo vive en el schema `public`; los contextos no están separados a nivel de base.
- Payments referencia Attention sin FK (excepción documentada arriba).
- `fulfillments.status` sigue siendo un `varchar` con `CHECK` (no es configurable por sede).
- Reembolsos modelados pero no habilitados (decisión N1).
- Sin cajas ni turnos en el cierre diario (decisión N9).
- La concurrencia de la atención aún no compara `version` (pendientes C5 y C6).
