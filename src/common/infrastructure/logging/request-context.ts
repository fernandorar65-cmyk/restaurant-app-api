import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  requestId: string;
  method?: string;
  /** Read when an error is logged: the route params are known by then. */
  path?: () => string;
  userId?: () => string | undefined;
  /** Set by the exception filter for the error being reported. */
  failure?: { statusCode: number; errorCode: string };
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Runs `work` with the given context visible to every log written inside it. */
export function runWithRequestContext<T>(context: RequestContext, work: () => T): T {
  return storage.run(context, work);
}

export function currentRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

/** Id of the request being served, or undefined outside of a request. */
export function currentRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}
