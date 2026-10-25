# Propuesta: DDD + Arquitectura Hexagonal por contexto

Este documento describe **cómo se reorganizaría el código actual** (feature-based, con TypeORM mezclado en todo) hacia una arquitectura por **contextos acotados (bounded contexts)** con **DDD + Hexagonal (puertos y adaptadores)**, pensada para poder migrar cada contexto a un servicio independiente en el futuro con el menor esfuerzo posible.

Es solo el plan — **no se ha tocado código todavía**.

---

## 1. Objetivo

Hoy, `organizations/products/entities/product.entity.ts` es a la vez:
- la entidad de negocio,
- la entidad de persistencia (decorada con `@Entity`, `@Column`, `@ManyToOne` de TypeORM),
- y lo que viaja hacia/desde Swagger (`@ApiProperty`).

Eso significa que el dominio (las reglas de negocio) está **acoplado a TypeORM y a Postgres**. Si mañana cambiamos de ORM, de base de datos, exponemos el mismo contexto por gRPC además de REST, o movemos `attention` a su propio microservicio, hay que tocar las mismas clases que contienen las reglas de negocio.

La arquitectura hexagonal invierte esto: **el dominio no depende de nada** (ni de TypeORM, ni de Nest, ni de Express). Todo lo externo (Postgres, HTTP, Swagger) se conecta al dominio mediante **puertos** (interfaces) y **adaptadores** (implementaciones concretas).

---

## 2. Principio rector: la regla de dependencia

```
Infraestructura  →  Aplicación  →  Dominio
   (conoce todo)     (conoce dominio)   (no conoce nada)
```

- **Dominio**: no importa nada de `typeorm`, `@nestjs/*`, `express`, etc. Solo TypeScript puro.
- **Aplicación**: orquesta casos de uso usando el dominio y **puertos** (interfaces) que el dominio/aplicación define pero no implementa.
- **Infraestructura**: implementa esos puertos (ej. un repositorio con TypeORM) y expone el mundo exterior hacia la aplicación (ej. un controller HTTP).

Las flechas de importación **nunca** van de dominio hacia afuera. Si el dominio necesita guardar algo, define una interfaz (`UserRepository`) — y es infraestructura quien la implementa (`TypeOrmUserRepository`) y se la "inyecta" al revés (inversión de dependencias).

---

## 3. Las tres capas, explicadas

### 3.1 `domain/` — el corazón, sin dependencias externas

- **Entidades de dominio**: clases planas con las reglas de negocio e invariantes (ej. `Role` no puede tener un nombre vacío). **No** tienen decoradores de TypeORM ni de Swagger.
- **Value Objects** (opcional, donde aporte): ej. `Email`, `Money`, para encapsular validación/formato.
- **Puertos de salida (`repositories/`)**: interfaces que la aplicación necesita para persistir/consultar, ej. `RoleRepository` con `findById`, `save`, `delete`. Viven en el dominio porque son parte del *contrato* del negocio, aunque la implementación sea infraestructura.
- **Excepciones de dominio**: ej. `RoleNotFoundError`, en vez de lanzar `NotFoundException` de Nest directamente desde el dominio.

### 3.2 `application/` — casos de uso, orquestación

- **Application services** (uno por feature, ej. `RolesService` dentro de `application/`): coordinan el flujo (validar, llamar al puerto del repositorio, aplicar reglas que cruzan varias entidades). No saben si el repositorio es Postgres, Mongo o memoria — solo conocen la interfaz (`RoleRepository`).
- Reciben/devuelven **entidades de dominio**, no entidades ORM.
- Aquí es donde iría, por ejemplo, la regla "no se puede crear un rol con un nombre que ya existe".

> Elegido: **DDD + Hexagonal simple** (sin CQRS). Un solo *application service* por feature con un método por operación (`create`, `findAll`, `findOne`, `update`, `remove`), en vez de una clase por caso de uso. Es el punto intermedio: ya separa dominio de infraestructura, sin el boilerplate de Commands/Queries/Handlers. Si más adelante un contexto crece mucho (ej. `attention` con reglas complejas de estados de orden), ese contexto puntual puede evolucionar a una clase por caso de uso sin afectar a los demás.

### 3.3 `infrastructure/` — todo lo que conecta con el mundo real

- **`persistence/typeorm/`**:
  - `entities/`: las entidades ORM actuales (con `@Entity`, `@Column`, relaciones). Dejan de llamarse "la" entidad y pasan a ser el **modelo de persistencia**.
  - `mappers/`: funciones/clases que convierten `OrmEntity ↔ DomainEntity`.
  - `repositories/`: implementan los puertos del dominio usando `Repository<OrmEntity>` de TypeORM (ej. `TypeOrmRoleRepository implements RoleRepository`).
- **`http/`**:
  - `controllers/`: adaptadores de entrada (*driving adapters*). Reciben el request HTTP, llaman al application service, devuelven la respuesta.
  - `dto/`: DTOs de entrada/salida HTTP con `class-validator` y `@ApiProperty` — **estos sí pueden tener decoradores**, porque son infraestructura (la "forma" en que el mundo le habla a la app), no dominio.
- **`<contexto>.module.ts`**: el único lugar que conoce tanto el puerto como el adaptador, y los conecta vía token de inyección de Nest.

> Elegido: **separación completa** dominio/ORM con mapper, en vez de reusar la entidad TypeORM como entidad de dominio. Es más archivos por tabla, pero es lo que realmente desacopla el negocio de Postgres/TypeORM — que es justo el objetivo de "listo para migrar".

---

## 4. Estructura de carpetas objetivo

Cada contexto (`iam`, `organizations`, `attention`) se reorganiza así por dentro. Detallo `iam` completo como referencia; `organizations` y `attention` siguen el mismo patrón por cada feature que ya existe hoy.

```
src/
  contexts/
    iam/
      domain/
        entities/
          user.entity.ts
          role.entity.ts
          permission.entity.ts
          role-permission.entity.ts
        repositories/                 <- puertos (interfaces)
          user.repository.ts
          role.repository.ts
          permission.repository.ts
          role-permission.repository.ts
        exceptions/
          user-not-found.error.ts
          role-not-found.error.ts
          duplicate-email.error.ts
          ...

      application/
        users/
          users.service.ts            <- application service (usa UserRepository, RoleRepository)
        roles/
          roles.service.ts
        permissions/
          permissions.service.ts
        role-permissions/
          role-permissions.service.ts
        ports/
          password-hasher.port.ts     <- puerto para hashear contraseñas (hoy es un util de infraestructura)

      infrastructure/
        persistence/
          typeorm/
            entities/
              user.orm-entity.ts
              role.orm-entity.ts
              permission.orm-entity.ts
              role-permission.orm-entity.ts
            mappers/
              user.mapper.ts
              role.mapper.ts
              permission.mapper.ts
              role-permission.mapper.ts
            repositories/
              typeorm-user.repository.ts
              typeorm-role.repository.ts
              typeorm-permission.repository.ts
              typeorm-role-permission.repository.ts
        security/
          scrypt-password-hasher.ts   <- implementa password-hasher.port.ts
        http/
          controllers/
            users.controller.ts
            roles.controller.ts
            permissions.controller.ts
            role-permissions.controller.ts
          dto/
            users/
              create-user.dto.ts
              update-user.dto.ts
            roles/
              create-role.dto.ts
              update-role.dto.ts
            permissions/
              ...
            role-permissions/
              ...

      iam.module.ts                   <- wiring: liga cada puerto a su adaptador

    organizations/
      domain/        (organization, restaurant, dining-table, table-qr-code,
                       employee, menu, category, product, kitchen-supply)
      application/    (mismo patrón: un service por feature)
      infrastructure/
        persistence/typeorm/   (entities, mappers, repositories)
        http/                  (controllers, dto)
      organizations.module.ts

    attention/
      domain/         (order, order-item, order-status-history)
      application/
      infrastructure/
        persistence/typeorm/
        http/
      attention.module.ts

  shared/                             <- "kernel" compartido entre contextos
    domain/
      entity.base.ts                  <- clase base de dominio (solo id, sin decoradores)
    application/
      api-response.interface.ts       <- (hoy en common/interfaces)
    infrastructure/
      http/
        transform.interceptor.ts      <- (hoy en common/interceptors)
        http-exception.filter.ts      <- (hoy en common/filters)
      persistence/typeorm/
        base.orm-entity.ts            <- (hoy common/entities/base.entity.ts: id, createdAt, updatedAt)
      database/
        typeorm.config.ts
        data-source.ts
        entities.ts

  main.ts
  app.module.ts
```

**Qué cambia respecto a hoy**: `common/` se convierte en `shared/`, separando también sus propias piezas en domain/application/infrastructure (la base de entidad ORM es infraestructura; el `ApiResponse` interface es un contrato de aplicación/HTTP, no de dominio puro — pero como es un detalle menor y transversal, puede quedarse simple sin sobre-diseñarlo).

---

## 5. Ejemplo end-to-end: `roles`

Para que quede concreto, así se vería **una sola feature** (`roles`) migrada, de punta a punta.

### Dominio (`domain/entities/role.entity.ts`)
```ts
export class Role {
  constructor(
    public readonly id: string,
    private name: string,
    private description: string | null,
  ) {}

  rename(newName: string): void {
    if (newName.trim().length < 2) {
      throw new Error('El nombre del rol debe tener al menos 2 caracteres');
    }
    this.name = newName;
  }

  get currentName(): string {
    return this.name;
  }
  // ...
}
```

### Puerto (`domain/repositories/role.repository.ts`)
```ts
export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  save(role: Role): Promise<Role>;
  delete(id: string): Promise<boolean>;
}

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
```

### Application service (`application/roles/roles.service.ts`)
```ts
@Injectable()
export class RolesService {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
  ) {}

  async create(name: string, description?: string): Promise<Role> {
    const existing = await this.roleRepository.findByName(name);
    if (existing) throw new RoleAlreadyExistsError(name);
    const role = new Role(crypto.randomUUID(), name, description ?? null);
    return this.roleRepository.save(role);
  }
  // findAll, findOne, update, remove...
}
```

### ORM entity (`infrastructure/persistence/typeorm/entities/role.orm-entity.ts`)
Es, básicamente, el `role.entity.ts` que ya existe hoy (con `@Entity`, `@Column`, etc.), renombrado para dejar claro que es el modelo de persistencia, no el de dominio.

### Mapper (`infrastructure/persistence/typeorm/mappers/role.mapper.ts`)
```ts
export class RoleMapper {
  static toDomain(orm: RoleOrmEntity): Role {
    return new Role(orm.id, orm.name, orm.description ?? null);
  }
  static toPersistence(domain: Role): RoleOrmEntity {
    const orm = new RoleOrmEntity();
    orm.id = domain.id;
    orm.name = domain.currentName;
    return orm;
  }
}
```

### Adaptador de repositorio (`infrastructure/persistence/typeorm/repositories/typeorm-role.repository.ts`)
```ts
@Injectable()
export class TypeOrmRoleRepository implements RoleRepository {
  constructor(
    @InjectRepository(RoleOrmEntity) private readonly repo: Repository<RoleOrmEntity>,
  ) {}

  async findById(id: string) {
    const found = await this.repo.findOne({ where: { id } });
    return found ? RoleMapper.toDomain(found) : null;
  }
  async save(role: Role) {
    const saved = await this.repo.save(RoleMapper.toPersistence(role));
    return RoleMapper.toDomain(saved);
  }
  // ...
}
```

### Controller (`infrastructure/http/controllers/roles.controller.ts`)
Igual que hoy: recibe el DTO HTTP, llama a `RolesService` (el application service), devuelve el resultado. El controller **no sabe** que existe TypeORM.

### Módulo (`iam.module.ts`)
```ts
@Module({
  imports: [TypeOrmModule.forFeature([RoleOrmEntity, /* ...otras */])],
  controllers: [RolesController, /* ...otros */],
  providers: [
    RolesService,
    { provide: ROLE_REPOSITORY, useClass: TypeOrmRoleRepository },
    // ...
  ],
})
export class IamModule {}
```

Esta última línea es la clave de todo: **el único lugar del proyecto que sabe que "roles" se guarda en Postgres vía TypeORM es este `provide`**. Cambiar de ORM/DB es cambiar esa línea (y el adaptador), nunca el dominio ni la aplicación.

---

## 6. Límites entre contextos (importante para la migración futura)

Hoy `OrderItem` (en `attention`) tiene FKs directas a `Product` (en `organizations`) y a `User` (en `iam`), y las valida llamando directamente al `ProductsService`/service del otro contexto.

Si el objetivo es poder separar contextos en servicios independientes más adelante, la regla a futuro debería ser:

- Un contexto **nunca** importa el `repository` (puerto ni adaptador) ni la entidad ORM de otro contexto.
- Entre contextos solo se pasan **IDs primitivos** (`productId: string`), nunca objetos de dominio de otro contexto.
- Si un contexto necesita *validar* que algo existe en otro (ej. "este `productId` existe"), lo hace a través de un **puerto propio** que apunta a una interfaz pequeña (ej. `ProductLookupPort` con `exists(id): Promise<boolean>`), cuya implementación en monolito llama al `ProductsService` de `organizations`, y en microservicios llamaría por HTTP/mensajería al servicio de `organizations`.

Esto no hay que resolverlo todo ahora, pero es la pieza que de verdad habilita "migrar a futuro sin reescribir reglas de negocio" — vale la pena tenerlo en mente al migrar `attention`, que es el contexto con más dependencias cruzadas.

---

## 7. Qué hacemos con lo que no entra en esta reorganización

- **`auth/`** (login en memoria) y **`menu-items/`** (CRUD demo en memoria): quedan fuera de este plan por ahora. Son código de ejemplo/histórico que no sigue el modelo de tablas real. Se puede decidir después si se eliminan o se integran como parte de `iam` (auth) y `organizations` (menu-items).

---

## 8. Plan de migración sugerido (por fases)

1. **Fase 0 — Kernel compartido**: mover `common/` → `shared/` con la subdivisión domain/application/infrastructure (bajo riesgo, es la base para todo lo demás).
2. **Fase 1 — Piloto: `iam`**: es el contexto más chico (4 tablas) y no depende de ningún otro contexto. Sirve para validar el patrón completo (dominio, puerto, application service, mapper, adaptador, wiring) antes de replicarlo.
3. **Fase 2 — `organizations`**: 9 tablas, todas dentro del mismo contexto (sin dependencias cruzadas hacia `iam`/`attention`).
4. **Fase 3 — `attention`**: el más chico en tablas (3) pero el único con dependencias cruzadas reales (`Product`, `User`) — aquí es donde se aplica el punto 6 (puertos de lookup entre contextos).
5. **Fase 4 — Legacy**: decidir qué hacer con `auth/` y `menu-items/`.

Cada feature dentro de una fase se migra con el mismo checklist:
- [ ] Crear entidad de dominio (clase pura)
- [ ] Crear puerto de repositorio (interfaz)
- [ ] Mover la entidad TypeORM actual a `infrastructure/persistence/typeorm/entities/` como `*.orm-entity.ts`
- [ ] Crear mapper domain ↔ orm
- [ ] Crear adaptador de repositorio (implementa el puerto)
- [ ] Mover el `*.service.ts` actual a `application/`, haciendo que dependa del puerto (no del `Repository<T>` de TypeORM directamente)
- [ ] Mover controller + DTOs HTTP a `infrastructure/http/`
- [ ] Actualizar el `*.module.ts` del contexto para hacer el `provide` del puerto → adaptador
- [ ] Verificar que compila y que el CRUD sigue respondiendo igual (mismos endpoints, mismo contrato)

---

## 9. Qué queda fuera de esta propuesta (por ahora)

- **CQRS** (Commands/Queries/Handlers separados): no se incluye — se descartó a favor de application services simples. Se puede introducir más adelante *solo* en el contexto que lo necesite (ej. `attention` si la lógica de estados de orden crece mucho), sin afectar a los demás.
- **Domain events / event bus**: útil cuando haya que notificar entre contextos sin acoplarlos directamente (ej. "orden pagada" → afecta inventario). No es necesario para el alcance actual, pero el puerto de la sección 6 es el punto natural donde esto encajaría después.
- **Value Objects exhaustivos** (`Email`, `Money`, `PositiveInt`, etc.): se pueden ir incorporando feature por feature donde aporten validación real, no de entrada en todas las entidades.

---

## 10. Estado de la migración

- [x] **Fase 1 — `iam` (piloto)**: migrado a `src/contexts/iam/` (domain / application / infrastructure). Verificado en vivo (CRUD completo + validaciones + Swagger) contra Postgres real.
  - Base compartida agregada en el camino (sin mover todo `common/` todavía): `common/domain/domain-error.ts` (errores de dominio base) y `common/persistence/base.orm-entity.ts` (base de entidad ORM sin decoradores de Swagger).
  - `HttpExceptionFilter` ahora traduce `NotFoundDomainError` → 404 y `ConflictDomainError` → 409 automáticamente.
  - Contraseña: se dejó de usar `select: false` de TypeORM para ocultarla; ahora el dominio siempre carga el hash completo, y es el `UserResponseDto` (capa HTTP) el que decide no incluirla — más robusto y más alineado a "la presentación decide qué se expone", no la persistencia.
  - `src/iam/` (feature-based) fue **eliminado** por completo, ya no existe.
  - `organizations` y `attention` quedan sin cambios; `attention/order-items/entities/order-item.entity.ts` solo actualizó su referencia a `UserOrmEntity` en la nueva ruta (acoplamiento cruzado pendiente de resolver en la Fase 3, ver sección 6).
- [x] **Fase 2 — `organizations`**: migrado a `src/contexts/organizations/` (9 tablas: organizations, restaurants, dining_tables, table_qr_codes, employees, menus, categories, products, kitchen_supplies). Verificado en vivo contra Postgres real, incluyendo el flujo cruzado con `attention` (órdenes referenciando mesas y productos ya migrados).
  - Gotcha de TypeORM encontrado y corregido: columnas nullable tipadas como `string | null` en la entidad ORM rompían la inferencia de tipo de columna (`emitDecoratorMetadata` emite `Object` para tipos unión, y TypeORM no sabe mapear `Object` a un tipo de columna Postgres). Se tipan como `string | undefined` (opcional) en la entidad ORM, y el mapper convierte `null` del dominio a `undefined` al persistir.
  - Gotcha de precisión: columnas `decimal` de Postgres regresan como `string` vía el driver `pg` aunque TypeORM las tipe como `number`; los mappers de `Product` y `KitchenSupply` hacen `Number(orm.price)` / `Number(orm.quantity)` explícitamente al mapear a dominio.
  - `src/organizations/` (feature-based) fue **eliminado** por completo.
  - `attention/orders` y `attention/order-items` solo actualizaron sus imports a las nuevas rutas de `DiningTableOrmEntity` y `ProductOrmEntity` (el acoplamiento cruzado en sí sigue pendiente de resolver con un puerto de lookup, ver sección 6 — se resuelve en la Fase 3).
- [x] **Fase 3 — `attention`**: migrado a `src/contexts/attention/` (orders, order_items, order_status_history). Esta fase además resolvió el punto de la sección 6:
  - Se crearon dos **puertos de lookup** propios de `attention` (`application/ports/`): `DiningTableLookupPort` (`exists(id)`) y `ProductLookupPort` (`findById(id)` → `{ id, price }`, solo la proyección que `attention` necesita).
  - Se crearon dos **excepciones propias** de `attention` (`domain/exceptions/external-reference.errors.ts`): `DiningTableReferenceNotFoundError` y `ProductReferenceNotFoundError` — `attention` ya **no** importa ni lanza las excepciones de dominio de `organizations` (`DiningTableNotFoundError`, `ProductNotFoundError`).
  - Los adaptadores (`infrastructure/lookups/`) sí conocen a `organizations` hoy (llaman a `DiningTablesService`/`ProductsService` directo, atrapando sus excepciones y traduciéndolas a `null`/`false`) — es el **único lugar** del contexto con ese acoplamiento. Migrar `attention` a un servicio aparte en el futuro significa reemplazar únicamente estos dos archivos (por un cliente HTTP/gRPC, por ejemplo), sin tocar dominio, aplicación, ni controllers.
  - Verificado en vivo: orden con mesa inexistente y order-item con producto inexistente devuelven 404 con el mensaje de `attention`, no el de `organizations`; `unitPrice` se sigue tomando correctamente del precio real del producto; crear una entrada de historial sigue actualizando el `status` de la orden.
  - `src/attention/` (feature-based) fue **eliminado** por completo.
- [x] **Fase 4 — legacy**: `src/auth/` y `src/menu-items/` fueron **eliminados** por completo (código de ejemplo en memoria, redundante con `iam/users` y `organizations/products`, que ya persisten en Postgres con DDD + Hexagonal). Verificado que sus rutas (`/auth/*`, `/menu-items/*`) devuelven 404 y que el resto del sistema sigue funcionando.

**Migración completa: las 4 fases están hechas.** El proyecto completo (16 tablas en 3 contextos) sigue el patrón DDD + Hexagonal descrito en este documento.

## 11. Resumen de la decisión tomada

| Pregunta | Decisión |
|---|---|
| Alcance de esta propuesta | Documento de diseño únicamente, sin tocar código todavía |
| Rigurosidad hexagonal | DDD + Hexagonal simple (sin CQRS) |
| Separación dominio/ORM | Completa, con mapper por entidad |
| Orden de migración sugerido | `shared/` → `iam` (piloto) → `organizations` → `attention` → legacy |
