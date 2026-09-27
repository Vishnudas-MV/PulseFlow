import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  traceId: string;
  correlationId?: string;
  tenantId?: string;
  userId?: string;
  [key: string]: unknown;
}

export class AsyncContext {
  private static readonly storage = new AsyncLocalStorage<RequestContext>();

  /**
   * Executes a callback within the context of a specific RequestContext.
   */
  public static run<R>(context: RequestContext, fn: () => R): R {
    return this.storage.run(context, fn);
  }

  /**
   * Retrieves the current asynchronous request context, if active.
   */
  public static get(): RequestContext | undefined {
    return this.storage.getStore();
  }

  /**
   * Retrieves the active traceId, or a default fallback if outside a request scope.
   */
  public static getTraceId(): string {
    const store = this.storage.getStore();
    return store?.traceId ?? 'system-trace';
  }

  /**
   * Sets a property on the active request context.
   */
  public static setProperty(key: string, value: unknown): void {
    const store = this.storage.getStore();
    if (store) {
      store[key] = value;
    }
  }
}
