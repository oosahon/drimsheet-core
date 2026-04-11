import { AsyncLocalStorage } from 'node:async_hooks';
import IRequestContext, {
  IRequestContextData,
} from '../contracts/app/request-context.contract';

const asyncLocalStorage = new AsyncLocalStorage<IRequestContextData>();

export default function storageService(): IRequestContext {
  return {
    init(store, callback) {
      asyncLocalStorage.run(store, callback);
    },

    get() {
      const store = asyncLocalStorage.getStore();

      if (!store) {
        throw new Error('Store not found');
      }

      return store;
    },

    set(store) {
      const currentStore = this.get();
      Object.assign(currentStore, store);
    },
  };
}
