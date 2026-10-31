# Checklist de pendientes

Lista única para ir eligiendo qué abordar: indica los códigos (por ejemplo, "haz C1, C3 y F1") y se marcan con `[x]` al terminarlos. Consolida [pendientes-arquitectura.md](pendientes-arquitectura.md), [finanzas-pendientes.md](finanzas-pendientes.md) y el análisis de arquitectura (SOLID, DDD y monolito modular).

**Actualizado:** 2026-10-26 · Prioridad: 🔴 crítica · 🟠 alta · 🟡 media · 🟢 baja · Esfuerzo: B bajo · M medio · A alto

## 1. Críticos antes de cualquier ambiente compartido

- [ ] **C1** 🔴 M — Migración inicial con el modelo actual y `synchronize: false` (#8)
- [ ] **C2** 🔴 B — Seed idempotente de permisos y roles base (#9). *Conviene junto con C1*
- [ ] **C3** 🔴 A — Permisos por endpoint y alcance por organización y sede según la membresía (#5)
- [ ] **C4** 🔴 B — Secretos JWT obligatorios: la app no arranca sin ellos (#6)
- [ ] **C5** 🔴 B — Una orden no puede reabrir una atención cerrada o cancelada: leerla con bloqueo dentro de la transacción (#1)
- [ ] **C6** 🔴 B — `requestBill`, `close` y `cancel` sin pisar cambios simultáneos (#2)
- [ ] **C7** 🔴 M — Primer pedido del comensal atómico: validar el carrito antes de abrir la atención (#3), y bloquear el pedido si no llega al monto mínimo de la modalidad (#25)

## 2. Arquitectura (SOLID, DDD y monolito modular)

- [ ] **R1** 🟠 M — Romper el ciclo attention ↔ payments (`forwardRef`): payments dueño del saldo, o la cuenta expuesta mediante un puerto sin dependencia de vuelta
- [ ] **R2** 🟡 M — Política única de FK entre contextos: FK solo hacia organizations e iam, o solo referencias lógicas (hoy hay 25 FK cruzadas y payments no usa ninguna)
- [ ] **R3** 🟡 M — Fachada pública por módulo en lugar de exportar servicios completos (por ejemplo, `AttentionBillingFacade`)
- [ ] **R4** 🟡 A — Eventos de dominio en proceso (y outbox más adelante) para efectos secundarios, empezando por el consumo de stock
- [ ] **R5** 🟢 B — Mover `Page` y `PageRequest` a `common/domain`: hoy 25 interfaces del dominio importan `common/application`
- [ ] **R6** 🟢 M — Value object `Money` compartido en lugar de `number` con redondeos repetidos
- [ ] **R7** 🟢 B — Regla automática de fronteras (`dependency-cruiser` u oxlint): prohibir imports entre contextos fuera de `infrastructure/lookups`
- [ ] **R8** 🟢 B — `diner-identity.resolver` usa `AuthService` de IAM directamente: pasarlo por un puerto
- [ ] **R9** 🟢 M — Dividir `PaymentsService` (registro, cancelación, saldo, pasarela) y `AuthService` (login, refresh, reseteo, bearer)

## 3. Tests y calidad

- [ ] **T1** 🟠 M — Pasar el smoke test (173 chequeos, en los dos modos de consumo) a `test/` como e2e (#12)
- [ ] **T2** 🟠 M — Tests de dominio de los contextos sin cobertura: attention (atención, ítems, fulfillment), catalog, organizations, finance (#12)
- [ ] **T3** 🟢 B — Arreglar `test/app.e2e-spec.ts`, que no compila (#24)

## 4. Finanzas (sin decisión de negocio)

- [ ] **F1** 🟠 B — Auditoría de la anulación de gastos: `voided_at`, `voided_by_user_id` y `void_reason` obligatorio
- [ ] **F2** 🟡 M — Vincular un gasto con su compra de inventario: un `PURCHASE` de la misma sede y un gasto por movimiento (#28)
- [ ] **F3** 🟡 B — Test de concurrencia: dos cierres simultáneos de la misma sede y fecha
- [ ] **F4** 🟡 B — Tests unitarios de la fórmula de `expected_cash`
- [ ] **F5** 🟢 B — Nombre de categoría de gasto único sin distinguir mayúsculas (`citext`)
- [ ] **F6** 🟢 B — Documentar que el MVP tiene un cierre por sede y fecha, sin cajas ni turnos
- [ ] **F7** 🟢 B — Método de pago obligatorio en los gastos
- [ ] **F8** 🟢 B — Repetir un cierre devuelve el existente (200) en lugar de 409

## 5. Funcionalidad pendiente

- [ ] **P1** 🟡 M — Webhook público por pasarela con verificación de firma, que llame a `ProviderEventsService` (#37). *Requiere elegir la pasarela*
- [ ] **P2** 🟢 B — Motivos secundarios de movimiento de inventario por organización (vencimiento, derrame, consumo del personal) (#40)

## 6. Documentación

- [ ] **D-1** 🟡 B — Consolidar las observaciones de ACMR en el SQL general y el documento definitivo de tablas (#31). El diagrama ya está al día
- [ ] **D-2** 🟢 B — Actualizar `arquitectura-ddd-hexagonal.md` y `Modelo de tablas.md` (#23)
- [ ] **D-3** 🟢 B — Alinear `comensales.md` y `restaurant.md` con el vocabulario actual (atención → órdenes → ítems)

## 7. Decisiones de negocio (bloquean lo indicado)

- [ ] **N1** — Reembolsos: parciales por producto (`refund_allocations`) o solo totales (#36). *Habilita el flujo de reembolsos y N8*
- [ ] **N2** — Flujo del descuento automático por receta: en qué estado del pedido, cómo se revierte al cancelar, si la receta cambia por sede (#39). *Habilita encender `INVENTORY_AUTO_CONSUMPTION`*
- [ ] **N3** — Fórmula de `expected_cash`: fondo inicial, retiros, ingresos manuales; si puede ser negativo y si el efectivo contado es obligatorio
- [ ] **N4** — Atenciones abiertas al cerrar el día: bloquear, advertir o registrarlas
- [ ] **N5** — Reapertura del cierre diario: nunca, o con permiso especial y auditoría
- [ ] **N6** — Gastos de una fecha ya cerrada: bloquearlos o marcar el cierre como desactualizado
- [ ] **N7** — Métodos de pago: enum compartido actual o catálogo administrado por ACMR
- [ ] **N8** — Reembolsos parciales dentro del cierre diario (depende de N1)
- [ ] **N9** — Varias cajas, cajeros o turnos por sede: cuándo hacen falta (`cash_registers`, `cash_sessions`)

## Orden sugerido

1. **C1 + C2**: migraciones y seeds; lo demás se apoya en un esquema versionado.
2. **C4, C5, C6**: esfuerzo bajo y riesgo alto.
3. **R5 + R7**: fronteras protegidas antes de seguir creciendo.
4. **T1**: el smoke dentro del repo da red de seguridad para lo que sigue.
5. **C3**: permisos.
6. **C7, R1, F1**.
7. El resto según las decisiones N1 a N9.
