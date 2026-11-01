# Restaurant API (ACMR)

Backend de **Restaurant CMR**: gestión de restaurantes con pedidos desde la mesa por QR, recojo y delivery, cocina, cobros con varias pasarelas, inventario por sede y cierre diario de caja.

Construido como un **monolito modular** con **DDD y arquitectura hexagonal** sobre NestJS, TypeORM y PostgreSQL.

---

## Stack

| | |
|---|---|
| Runtime | Node.js (desarrollado con v24), TypeScript, módulos ESM |
| Framework | NestJS 12 |
| Base de datos | PostgreSQL 16 (Docker) con TypeORM |
| Validación | class-validator / class-transformer, mensajes en español |
| Documentación de la API | Swagger (OpenAPI) en `/docs` |
| Tests | Vitest |
| Lint | oxlint (con chequeo de tipos) |

---

## Puesta en marcha

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env

# 3. Base de datos (PostgreSQL 16 en el puerto DB_PORT, por defecto 5433)
docker compose up -d

# 4. Crear o actualizar el esquema (migraciones versionadas)
npm run migration:run

# 5. Levantar la API en modo desarrollo
npm run start:dev
```

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`

El esquema se crea **solo con migraciones** (`npm run migration:run`; `migration:revert` y `migration:show` también existen). `synchronize` está apagado. Una base creada antes con `synchronize` se adopta tal cual en la primera migración y luego se migra con sus datos. Al arrancar se cargan los catálogos de ACMR (estados de pago y reembolso, unidades de medida y tipos de movimiento de inventario). Cada sede nueva recibe sus estados de atención, estados de orden y tipos de servicio. El modelo está en [docs/modelo-tablas/base-de-datos.md](docs/modelo-tablas/base-de-datos.md).

### Primer uso

1. Registra un dueño con `POST /api/v1/owner/auth/register`. En una sola transacción crea el usuario, la organización, el rol OWNER, la membresía y la primera sede, y devuelve la sesión.
2. Usa el `accessToken` como `Authorization: Bearer <token>` (en Swagger, botón **Authorize**).
3. Para usar la API privada de ACMR (`/platform/*`), marca al usuario como administrador de la plataforma. Esto solo se hace desde la base de datos; ninguna ruta de la API lo permite:

   ```sql
   UPDATE users SET is_platform_admin = true WHERE email = 'tu@correo.com';
   ```

### Variables de entorno

| Variable | Para qué sirve | Por defecto en `.env.example` |
|---|---|---|
| `PORT` | Puerto de la API | `3000` |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | Conexión a PostgreSQL | `localhost`, `5433`, `postgres`, `postgres`, `restaurant_api` |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Firma de los tokens. **Obligatorias y distintas entre sí**; en producción, de al menos 32 caracteres y distintas a las de ejemplo | valores de desarrollo |
| `PUBLIC_APP_URL` | URL de la app del comensal; los QR de las mesas apuntan a `<PUBLIC_APP_URL>/t/<token>` | `http://localhost:5173` |
| `INVENTORY_AUTO_CONSUMPTION` | Descuento automático de stock por receta al preparar un plato | `false` |
| `LOG_LEVEL`, `LOG_FORMAT` | Nivel (`fatal`…`verbose`) y formato (`text`/`json`) de los logs | `log`, `text` |
| `ERROR_LOG_RETENTION_DAYS` | Días que se conservan los errores en la tabla `error_logs` | `30` |
| `NODE_ENV` | `production` endurece la validación de secretos e ignora `DB_SYNCHRONIZE` | — |
| `DB_SYNCHRONIZE` | `true` vuelve a sincronizar el esquema desde las entidades. **Solo para una base local desechable**: borra columnas sin migrar datos | `false` |

La app **no arranca** si la configuración es inválida (`src/common/infrastructure/config/environment.validation.ts`).

---

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run start:dev` | API en modo watch |
| `npm run build` / `npm run start:prod` | Compilar y ejecutar `dist/` |
| `npm test` | Tests unitarios (`*.spec.ts`) |
| `npm run test:e2e` | Tests e2e (`*.e2e-spec.ts`). El test del modelo crea una base temporal, así que necesita el Postgres de Docker levantado |
| `npm run lint` | oxlint con chequeo de tipos |
| `npm run format` | Prettier |
| `npm run migration:generate` / `migration:run` / `migration:revert` | Migraciones TypeORM (todavía no hay ninguna) |

> `test/app.e2e-spec.ts` no compila (viene de la plantilla de Nest; pendiente T3).

---

## Arquitectura

### Contextos (bounded contexts)

Cada contexto es un módulo Nest dueño de sus tablas. Ninguno escribe en las tablas de otro.

| Contexto | Responsabilidad |
|---|---|
| `iam` | Identidad única (comensales y personal), login y refresh, roles, permisos y membresías |
| `organizations` | Organizaciones, sedes, modalidades de atención, pisos, mesas con QR, áreas, puestos y empleados |
| `catalog` | Categorías en árbol, productos, menús y secciones, validación del carrito |
| `attention` | Atención (visita), órdenes, platos con su flujo de cocina, recojo y delivery, cuenta |
| `payments` | Cobros con asignación por plato, estados internos, mapeo de pasarelas, eventos idempotentes; reembolsos modelados |
| `inventory` | Insumos maestros, stock por sede, movimientos inmutables con reversión, conteos, recetas |
| `finance` | Categorías de gasto, gastos con anulación y cierre diario |
| `observability` | Registro de errores en `error_logs` con retención automática |
| `common` | Núcleo compartido: errores de dominio, value objects, paginación, transacciones, logging y filtros HTTP |

### Capas dentro de cada contexto

```
src/<contexto>/
├── domain/           Entidades con reglas de negocio, enums, errores, interfaces de repositorios.
│                     Sin dependencias de NestJS ni TypeORM.
├── application/      Casos de uso (servicios) y puertos hacia otros contextos.
├── infrastructure/
│   ├── http/         Controllers y DTOs.
│   ├── persistence/  Entidades ORM, mappers y repositorios TypeORM.
│   └── lookups/      Adaptadores que implementan los puertos llamando a otros contextos.
└── <contexto>.module.ts
```

Reglas:
- El **dominio no importa** frameworks ni infraestructura.
- Un contexto se comunica con otro **solo mediante puertos** definidos en su capa `application`, implementados por adaptadores en `infrastructure/lookups`.
- Los errores de negocio heredan de `DomainError` y la API los devuelve con un `errorCode` estable y un mensaje en español.

### Convenciones de la API

- **Sesión obligatoria por defecto** (guard global). Las rutas abiertas se marcan con `@Public()`: registro, login y las rutas del comensal, donde el login es opcional.
- **API privada de ACMR** bajo `/platform/*`, solo para usuarios con `is_platform_admin`.
- **Respuestas** envueltas en `{ success, statusCode, message, data, timestamp, path }`. Los listados se paginan con `?page&limit` (máximo 100) y devuelven `{ items, meta }`.
- **`DELETE`** desactiva en lugar de borrar todo lo que tiene historial.
- **Idempotencia** con `requestId` o `idempotencyKey` en pedidos, pagos y movimientos de inventario.

---

## Documentación

| Documento | Contenido |
|---|---|
| [docs/modelo-tablas/base-de-datos.md](docs/modelo-tablas/base-de-datos.md) | Cómo funciona la base: cada tabla, su propósito y sus reglas |
| [docs/modelo-tablas/modelo-bd.png](docs/modelo-tablas/modelo-bd.png) | Diagrama de las 51 tablas ([SVG](docs/modelo-tablas/modelo-bd.svg)) |
| [docs/endpoints/estado-actual.md](docs/endpoints/estado-actual.md) | Referencia de la API vigente |
| [docs/arquitectura-ddd-hexagonal.md](docs/arquitectura-ddd-hexagonal.md) | Propuesta de arquitectura DDD + hexagonal |
| [docs/checklist-pendientes.md](docs/checklist-pendientes.md) | Checklist de pendientes y decisiones por tomar |
| [docs/pendientes-arquitectura.md](docs/pendientes-arquitectura.md) | Historial de puntos de arquitectura (hechos y pendientes) |
| [docs/finanzas-pendientes.md](docs/finanzas-pendientes.md) | Revisión del módulo de Finanzas frente al modelo de ACMR |

---

## Estado

El modelo de datos y la API cubren los siete contextos de negocio. Antes de desplegar en un ambiente compartido faltan los puntos críticos de la [checklist](docs/checklist-pendientes.md), principalmente:

- permisos por endpoint y alcance por organización y sede (C3);
- consistencia de la atención ante cambios simultáneos (C5 a C7).
