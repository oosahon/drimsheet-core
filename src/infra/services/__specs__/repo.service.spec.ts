import { ITransactionContext } from '@shared/types/repo.types';

import { postgres } from '@infra/config/postgres.config';
import repoService from '@infra/services/repo.service';

jest.mock('@infra/config/postgres.config', () => ({
  postgres: {
    transaction: jest.fn(),
  },
}));

type TPostgresTransaction = (
  fn: (tx: ITransactionContext) => Promise<unknown>
) => Promise<unknown>;

describe('repoService', () => {
  const postgresTransaction =
    postgres.transaction as unknown as jest.MockedFunction<TPostgresTransaction>;

  beforeEach(() => {
    postgresTransaction.mockReset();
  });

  it('reuses an existing transaction context', async () => {
    const tx: ITransactionContext = {};
    const transactionFn = jest.fn().mockResolvedValue('completed');

    await expect(repoService.runInTransaction(transactionFn, tx)).resolves.toBe(
      'completed'
    );

    expect(transactionFn).toHaveBeenCalledWith(tx);
    expect(postgresTransaction).not.toHaveBeenCalled();
  });

  it('opens a postgres transaction when no context is supplied', async () => {
    const tx: ITransactionContext = {};
    const transactionFn = jest.fn().mockResolvedValue('completed');
    postgresTransaction.mockImplementation(async (callback) => callback(tx));

    await expect(repoService.runInTransaction(transactionFn)).resolves.toBe(
      'completed'
    );

    expect(postgresTransaction).toHaveBeenCalledWith(expect.any(Function));
    expect(transactionFn).toHaveBeenCalledWith(tx);
  });
});
