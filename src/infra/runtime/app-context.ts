import { AsyncLocalStorage } from 'node:async_hooks';
import IAppContext, {
  IAppContextData,
} from '../../app/_internal/contracts/app-context.contract';
import runtimeError from '../../shared/errors/runtime.error';

const asyncLocalStorage = new AsyncLocalStorage<IAppContextData>();

const appContext: IAppContext = {
  init(store, callback) {
    asyncLocalStorage.run(store, callback);
  },

  get() {
    const store = asyncLocalStorage.getStore();

    if (!store) {
      throw new runtimeError.StoreNotFound();
    }

    return store;
  },

  set(store) {
    const currentStore = this.get();
    Object.assign(currentStore, store);
  },
};

export default appContext;
