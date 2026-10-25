import type { FindOptionsWhere, Repository } from 'typeorm';

/**
 * Factors out the find/save/delete boilerplate shared by every TypeORM
 * repository adapter in this codebase. Concrete repositories only need to
 * supply the domain<->ORM mapping and whatever finder methods are specific
 * to that entity.
 */
export abstract class TypeOrmBaseRepository<
  TDomain extends { id: string },
  TOrm extends { id: string },
> {
  constructor(protected readonly repository: Repository<TOrm>) {}

  protected abstract toDomain(orm: TOrm): TDomain;
  protected abstract toPersistence(domain: TDomain, existing?: TOrm): TOrm;

  /**
   * Hook for repositories that participate in a shared transaction (see
   * attention's TransactionContext). Defaults to the module-scoped
   * repository; override to resolve a transaction-bound one instead.
   */
  protected getRepository(_tx?: unknown): Repository<TOrm> {
    return this.repository;
  }

  async findById(id: string): Promise<TDomain | null> {
    const found = await this.repository.findOne({
      where: { id } as FindOptionsWhere<TOrm>,
    });
    return found ? this.toDomain(found) : null;
  }

  async findAll(): Promise<TDomain[]> {
    const rows = await this.repository.find();
    return rows.map((row) => this.toDomain(row));
  }

  async save(domain: TDomain, tx?: unknown): Promise<TDomain> {
    const repository = this.getRepository(tx);
    const existing = await repository.findOne({
      where: { id: domain.id } as FindOptionsWhere<TOrm>,
    });
    const orm = this.toPersistence(domain, existing ?? undefined);
    const saved = await repository.save(orm);
    return this.toDomain(saved);
  }

  async delete(id: string, tx?: unknown): Promise<boolean> {
    const result = await this.getRepository(tx).delete(id);
    return (result.affected ?? 0) > 0;
  }
}
