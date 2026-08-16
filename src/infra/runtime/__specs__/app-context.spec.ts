import runtimeError from '@shared/values/errors/runtime.error';

import { IAppContextData } from '@app/context/contracts/app-context.contract';

import appContext from '@infra/runtime/app-context';

describe('appContext', () => {
  const makeStore = (correlationId = 'correlation-id'): IAppContextData => ({
    correlationId,
    idempotencyKey: '',
  });

  it('throws when no store is active', () => {
    expect(() => appContext.get()).toThrow(runtimeError.StoreNotFound);
  });

  it('returns the active store without requiring optional enrichments', () => {
    const store = makeStore();

    const activeStore = appContext.init(store, () => appContext.get());

    expect(activeStore).toBe(store);
  });

  it('returns a store when every required key is present', () => {
    const user = { id: 'user-id' } as IAppContextData['user'];
    const accountingEntity = {
      id: 'accounting-entity-id',
    } as IAppContextData['accountingEntity'];
    const store = { ...makeStore(), user, accountingEntity };

    const activeStore = appContext.init(store, () =>
      appContext.get(['user', 'accountingEntity'])
    );

    expect(activeStore.user).toBe(user);
    expect(activeStore.accountingEntity).toBe(accountingEntity);
  });

  it('reports every missing required key and the active correlation', () => {
    const store = makeStore('missing-context-correlation');

    expect.assertions(3);

    appContext.init(store, () => {
      try {
        appContext.get(['user', 'accountingEntity']);
      } catch (error) {
        expect(error).toBeInstanceOf(runtimeError.ContextNotFound);
        expect((error as Error).message).toBe(
          'runtime_error_context_context_not_found_unexpected'
        );
        expect((error as InstanceType<typeof runtimeError.Base>).cause).toEqual(
          {
            requiredKeys: ['user', 'accountingEntity'],
            missingKeys: ['user', 'accountingEntity'],
            correlationId: 'missing-context-correlation',
          }
        );
      }
    });
  });

  it('treats null and undefined as missing but preserves other falsey values', () => {
    const store = {
      ...makeStore(),
      idempotencyKey: '',
      user: null,
    } as unknown as IAppContextData;

    appContext.init(store, () => {
      expect(() => appContext.get(['user'])).toThrow(
        runtimeError.ContextNotFound
      );
      expect(appContext.get(['idempotencyKey']).idempotencyKey).toBe('');
    });
  });

  it('enriches the active store through set', () => {
    const store = makeStore();
    const user = { id: 'user-id' } as IAppContextData['user'];

    appContext.init(store, () => {
      appContext.set({ user });

      expect(appContext.get(['user']).user).toBe(user);
    });
  });

  it('returns synchronous and asynchronous callback results', async () => {
    expect(appContext.init(makeStore(), () => 'sync-result')).toBe(
      'sync-result'
    );

    await expect(
      appContext.init(makeStore(), async () => 'async-result')
    ).resolves.toBe('async-result');
  });

  it('propagates callback rejection', async () => {
    const callbackError = new Error('callback failed');

    await expect(
      appContext.init(makeStore(), async () => {
        throw callbackError;
      })
    ).rejects.toBe(callbackError);
  });

  it('restores the outer store after nested execution', () => {
    appContext.init(makeStore('outer-correlation'), () => {
      appContext.init(makeStore('inner-correlation'), () => {
        expect(appContext.get().correlationId).toBe('inner-correlation');
      });

      expect(appContext.get().correlationId).toBe('outer-correlation');
    });
  });

  it('isolates concurrent stores', async () => {
    let releaseFirst: (() => void) | undefined;
    const firstCanFinish = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = appContext.init(makeStore('first-correlation'), async () => {
      await firstCanFinish;
      return appContext.get().correlationId;
    });

    const second = appContext.init(
      makeStore('second-correlation'),
      async () => {
        expect(appContext.get().correlationId).toBe('second-correlation');
        releaseFirst?.();
        return appContext.get().correlationId;
      }
    );

    await expect(Promise.all([first, second])).resolves.toEqual([
      'first-correlation',
      'second-correlation',
    ]);
  });
});
