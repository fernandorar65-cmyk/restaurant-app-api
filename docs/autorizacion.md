# Autorización: permisos y alcance por organización y sede

Cómo decide la API quién puede llamar cada ruta del personal (evaluación A1, pendiente #5). Las rutas de comensales (`/api/v1/attentions`, QR, carrito) son `@Public()` y se identifican por su cuenta; no pasan por esto.

## Modelo

- **Permisos:** `<área>.read` y `<área>.manage` para 10 áreas (`organizations`, `restaurants`, `staff`, `settings`, `catalog`, `attentions`, `kitchen`, `payments`, `inventory`, `finance`). Definidos en [common/domain/access.ts](../src/common/domain/access.ts); sus nombres, en [iam/domain/access-catalog.ts](../src/iam/domain/access-catalog.ts).
- **Membresía:** usuario + organización + rol + alcance (todas las sedes o una lista). Solo cuentan las `ACTIVE` con rol activo.
- **Roles base** (cada organización nueva los recibe; son editables): OWNER (todo, siempre), ADMIN (todo menos `organizations.manage`), CASHIER (atenciones y pagos), WAITER (atenciones y platos), KITCHEN (platos). Los administradores de plataforma (`users.is_platform_admin`) pueden todo.
- **Reglas:**
  - Toda acción que **modifica** exige el `.manage` de su área en la organización/sede del recurso.
  - Las **consultas** de operación solo exigen ser miembro con alcance a esa sede (`permission: null`).
  - Las consultas **sensibles** exigen su `.read`: **pagos** (`payments.read`), **finanzas** (`finance.read`) y **personal** (`staff.read`: empleados, roles, membresías).

## Cómo se declara

Cada ruta del personal declara exactamente una política; el `AuthorizationGuard` global **niega por defecto** cualquier ruta sin política, y el e2e [authorization.e2e-spec.ts](../test/access/authorization.e2e-spec.ts) falla si alguna queda sin declarar o usa un recurso sin resolver.

```ts
import { Authorize, Authenticated, CurrentActor, Scope } from '…/common/infrastructure/http/access/authorize.decorator.js';

@Authorize('catalog.manage', Scope.restaurant('body'))            // POST con restaurantId en el body
@Authorize(null, Scope.restaurant('query'), Scope.resource('category', 'categoryId', 'query'))  // listado: uno de los dos es obligatorio
@Authorize('catalog.manage', Scope.resource('product'))           // :id del path
@Authorize(null, Scope.resource('menu', 'menuId'))                // otro parámetro del path
@Authenticated()                                                  // solo sesión, sin tenant (perfil propio)
```

| Fuente | Uso |
|---|---|
| `Scope.organization(from, field = 'organizationId')` | El id de la organización viene en `body`, `query` o `params` |
| `Scope.restaurant(from, field = 'restaurantId')` | El id de la sede; el guard busca su organización |
| `Scope.resource(name, field = 'id', from = 'params')` | El id de un recurso; su contexto registra cómo encontrar su organización o sede |

- Si se pasan varias fuentes, gana la primera presente; si no viene ninguna, la respuesta es **400 `TENANT_SCOPE_REQUIRED`**. Por eso los listados que antes aceptaban filtros opcionales ahora exigen sede u organización.
- **Ordena las fuentes como las prioriza el caso de uso.** Si el body trae varias (p. ej. `diningTableId`, `serviceTypeId` y `restaurantId` al abrir una atención) y el servicio usa la mesa por sobre la sede, la mesa va primero: si no, alguien podría autorizarse con su propia sede y operar sobre la mesa de otra organización. El caso de uso sigue validando que los ids recibidos sean coherentes entre sí (misma sede u organización).
- Un recurso que no existe deja pasar la petición para que la ruta responda 404.
- `organization` y `restaurant` vienen incluidos como recursos. El resto los registra cada contexto en un `*ScopeResolvers` de su `infrastructure/http/` (ejemplo: [catalog-scope-resolvers.ts](../src/catalog/infrastructure/http/catalog-scope-resolvers.ts)), devolviendo `{ organizationId }` o `{ restaurantId }`, o `null` si no existe. Los nombres son globales: un contexto puede usar un recurso que registró otro (p. ej. payments usa `attention`).
- `@CurrentActor()` da el `Actor` en el handler cuando una ruta necesita filtrar por las organizaciones del usuario (`actor.organizationIds`) o decidir algo por permiso (`actor.can(...)`).

## Decisiones para rutas sin tenant

| Ruta | Política |
|---|---|
| `POST /organizations` | `@PlatformAdmin()`: las organizaciones nacen con el registro del dueño |
| `GET /organizations` | `@Authenticated()`, filtrado a las organizaciones del actor (todas si es administrador de plataforma) |
| `POST /users` | `@Authenticated()`: crear una cuenta no da acceso a nada; el acceso llega con una membresía, que exige `staff.manage` |
| Resto de `/users` | `@PlatformAdmin()` (datos personales de todas las cuentas) |
| `GET /permissions` | `@Authenticated()` (catálogo global, necesario para armar roles); el resto, `@PlatformAdmin()` |
| `/owner/me`, `/customer/me`, cambiar la propia contraseña, logout | `@Authenticated()` |
