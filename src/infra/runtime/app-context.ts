import { AsyncLocalStorage } from 'node:async_hooks';

import runtimeError from '@shared/values/errors/runtime.error';

import IAppContext, {
  IAppContextData,
  TAppContextWithRequiredKeys,
} from '@app/context/contracts/app-context.contract';

const asyncLocalStorage = new AsyncLocalStorage<IAppContextData>();

const appContext: IAppContext = {
  init(store, callback) {
    return asyncLocalStorage.run(store, callback);
  },

  get<K extends keyof IAppContextData = never>(requiredKeys?: readonly K[]) {
    const store = asyncLocalStorage.getStore();

    if (!store) {
      throw new runtimeError.StoreNotFound();
    }

    const missingKeys = requiredKeys?.filter(
      (requiredKey) => store[requiredKey] == null
    );

    if (missingKeys?.length) {
      throw new runtimeError.ContextNotFound({
        requiredKeys,
        missingKeys,
        correlationId: store.correlationId,
      });
    }

    return store as TAppContextWithRequiredKeys<K>;
  },

  set(store) {
    const currentStore = this.get();
    Object.assign(currentStore, store);
  },
};

export default appContext;
