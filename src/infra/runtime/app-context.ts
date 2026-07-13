import { AsyncLocalStorage } from 'node:async_hooks';
import contextError from '../../app/shared/errors/context.error';
import IAppContext, {
  IAppContextData,
} from '../../shared/contracts/app-context.contract';

const asyncLocalStorage = new AsyncLocalStorage<IAppContextData>();

const appContext: IAppContext = {
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

export default appContext;
