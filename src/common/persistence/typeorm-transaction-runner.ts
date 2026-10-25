import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { EntityManager } from 'typeorm';
import type { TransactionRunner } from '../application/ports/transaction-runner.port.js';
import type { TransactionContext } from '../domain/transaction-context.js';

export class TypeOrmTransactionContext implements TransactionContext {
  readonly kind = 'transaction-context' as const;

  constructor(readonly manager: EntityManager) {}
}

@Injectable()
export class TypeOrmTransactionRunner implements TransactionRunner {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
    return this.dataSource.transaction((manager) =>
      work(new TypeOrmTransactionContext(manager)),
    );
  }
}
