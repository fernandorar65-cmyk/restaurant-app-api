import { InitialSchema1761955200000 } from './migrations/1761955200000-InitialSchema.js';
import { ConfigurableCatalogs1761955300000 } from './migrations/1761955300000-ConfigurableCatalogs.js';

// Explicit list (not a glob) so the same migrations load from the compiled
// build (CLI) and from the TypeScript sources (e2e tests). Keep it in order.
export const migrations = [
  InitialSchema1761955200000,
  ConfigurableCatalogs1761955300000,
];
