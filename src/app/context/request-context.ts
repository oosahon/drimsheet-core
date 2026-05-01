import { AsyncLocalStorage } from 'node:async_hooks';
import IRequestContext, {
  IRequestContextData,
} from '../contracts/app/request-context.contract';
import contextError from '../errors/context.errors';

const asyncLocalStorage = new AsyncLocalStorage<IRequestContextData>();

export default function makeRequestContext(): IRequestContext {
  return {
    init(store, callback) {
      asyncLocalStorage.run(store, callback);
    },

    get() {
      const store = asyncLocalStorage.getStore();

      if (!store) {
        throw new contextError.StoreNotFound();
      }

      return store;
    },

    set(store) {
      const currentStore = this.get();
      Object.assign(currentStore, store);
    },
  };
}
