import { Global, Module } from '@nestjs/common';
import { ScopeResolverRegistry } from './scope-resolver.registry.js';

/** One registry of resource scope resolvers, filled by each context on init. */
@Global()
@Module({
  providers: [ScopeResolverRegistry],
  exports: [ScopeResolverRegistry],
})
export class AccessModule {}
