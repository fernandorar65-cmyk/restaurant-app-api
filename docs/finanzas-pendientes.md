# Finanzas: pendientes por hacer y por decidir

Resultado de contrastar el documento *Revisión del modelo de Finanzas — ACMR* con la implementación actual (`src/finance`).

**Fecha de revisión:** 2026-10-26 · **Resumen:** 6 puntos por hacer · 7 decisiones abiertas · 8 puntos parciales que dependen de esas decisiones

| Leyenda | |
|---|---|
| ❌ | No implementado |
| ⚠️ | Implementado a medias |
| 🔴 Alta · 🟡 Media · 🟢 Baja | Prioridad |

## 1. Por hacer (no requieren decisión de negocio)

| # | Estado | Prioridad | Pendiente | Situación actual | Qué hacer | Esfuerzo |
|---|---|---|---|---|---|---|
| F1 | ❌ | 🔴 Alta | Auditoría de la anulación de gastos | `POST /expenses/:id/void` solo cambia `status` a `VOIDED` | Agregar `voided_at`, `voided_by_user_id` y `void_reason` (obligatorio) a `expenses`; tomar el usuario de la sesión | Bajo |
| F2 | ❌ | 🟡 Media | Vincular un gasto con su compra de inventario | La columna `inventory_movement_id` (única) existe, pero la API no la recibe (pendiente #28) | Aceptar `inventoryMovementId` validando que sea un `PURCHASE` del stock de la misma sede y que no tenga otro gasto | Medio |
| F3 | ❌ | 🟡 Media | Pruebas de concurrencia del cierre | La restricción única evita duplicados (409), pero no hay prueba | Test que lance dos cierres simultáneos de la misma sede y fecha | Bajo |
| F4 | ⚠️ | 🟡 Media | Pruebas de la fórmula de `expected_cash` | Fórmula documentada en `DailyClosure.compute`, cubierta solo por el smoke test | Tests unitarios de `DailyClosure`: efectivo, gastos en efectivo, pagos digitales, reembolsos | Bajo |
| F5 | ⚠️ | 🟢 Baja | Nombre de categoría de gasto único sin distinguir mayúsculas | Único por organización, pero "Alquiler" y "alquiler" pueden coexistir | Pasar `name` a `citext`, como en inventario y catálogo | Bajo |
| F6 | ❌ | 🟢 Baja | Documentar el alcance del cierre | No está escrito que el MVP tiene un único cierre por sede y fecha, sin cajas ni turnos | Agregarlo en `docs/endpoints/estado-actual.md` | Bajo |

## 2. Por decidir

| # | Decisión | Opciones | Situación actual | Impacto |
|---|---|---|---|---|
| D1 | Fórmula exacta de `expected_cash` | Mantener *efectivo cobrado − reembolsos en efectivo − gastos en efectivo* o sumar fondo inicial, retiros e ingresos manuales | Sin fondo inicial ni retiros (no existen cajas) | Define P2 y P3 |
| D2 | Atenciones abiertas al cerrar el día | Bloquear el cierre · advertir y permitir · permitir y registrarlas en el cierre | El cierre se registra sin control | Cambia `POST /daily-closures` |
| D3 | Reapertura del cierre | No se reabre nunca · se reabre con permiso especial y queda auditado | No hay reapertura; el cierre no se edita | Definir permiso y tabla de auditoría si se permite |
| D4 | Gastos de una fecha ya cerrada | Bloquear registrar, editar o anular gastos de fechas cerradas · permitirlo y marcar el cierre como desactualizado | Se permite y el cierre deja de coincidir sin aviso | Afecta P5 |
| D5 | Métodos de pago | Mantener el enum compartido (`CASH`, `CARD`, `YAPE`, `PLIN`, `BANK_TRANSFER`, `OTHER`) · catálogo administrado por ACMR | Un único enum en `common`, usado por payments, expenses y finance | Si se elige catálogo: migrar las tres tablas a una referencia |
| D6 | Varias cajas, cajeros o turnos | Mantener un cierre por sede y fecha · incorporar `cash_registers` y `cash_sessions` | No soportado | Rediseño del cierre si se incorpora |
| D7 | Reembolsos parciales en el cierre | Depende de la decisión de reembolsos de pagos (#36) | Reembolsos deshabilitados; el cálculo ya los separa en `refunded_amount` sin restarlos dos veces | Define P4 |

## 3. Puntos parciales que se resuelven con esas decisiones

| # | Estado | Punto | Situación actual | Depende de |
|---|---|---|---|---|
| P1 | ⚠️ | El método de pago del gasto indica por dónde salió el dinero | `payment_method` es opcional; un gasto sin método suma en `expense_amount` pero no se descuenta del efectivo | Hacerlo obligatorio (no requiere decisión mayor) |
| P2 | ⚠️ | `expected_cash` no oculta faltantes | Se recorta a 0 si los gastos en efectivo superan lo cobrado (la base exige `expected_cash >= 0`) | D1 |
| P3 | ⚠️ | El usuario siempre ingresa el efectivo contado | `actualCash` es opcional: se puede cerrar sin contar la caja y `difference_amount` queda en `null` | D1 |
| P4 | ⚠️ | La suma del desglose por método cuadra con el total del cierre | El desglose guarda el neto por método y suma `net_sales`, no `gross_sales`. Si los reembolsos de días anteriores superan lo cobrado en un método, ese método se recorta a 0 y deja de cuadrar | D7 |
| P5 | ⚠️ | El cierre es una foto fiel del día | Los gastos de fechas cerradas se pueden seguir cambiando | D4 |
| P6 | ⚠️ | Cierre idempotente | No se duplica (409), pero repetir la petición no devuelve el cierre existente | Devolverlo con 200 (no requiere decisión mayor) |
| P7 | ❌ | Permisos para registrar gastos, anularlos y cerrar el día | Basta con tener sesión | Pendiente general #5 (permisos y alcance por membresía) |
| P8 | ❌ | Control de atenciones abiertas al cerrar | Sin control | D2 |

## 4. Lo que ya cumple

- `expense_categories` por organización, con baja lógica; una categoría inactiva no admite gastos nuevos.
- `expenses` por sede, con categoría de la misma organización y monto mayor a 0 (dominio y base). Los anulados quedan fuera del cierre y no se editan.
- El vínculo con inventario es opcional y único; registrar una compra no crea gastos automáticamente, así que no hay duplicados.
- Un cierre por sede y fecha, calculado desde las fuentes (atenciones, pagos y reembolsos confirmados, gastos vigentes), en la zona horaria de la sede y sin fechas futuras.
- `difference_amount = actual_cash − expected_cash`. Los gastos digitales no restan del efectivo esperado y los reembolsos no se restan dos veces.
- Quedan registrados `closed_by_user_id` y `closed_at`; el cierre no tiene endpoints para editarse ni borrarse.
- El desglose por método se genera automáticamente, con una fila por cierre y método, en la misma transacción que el cierre.
- Finance no escribe en tablas de otros contextos: lee attention y payments a través de puertos.
