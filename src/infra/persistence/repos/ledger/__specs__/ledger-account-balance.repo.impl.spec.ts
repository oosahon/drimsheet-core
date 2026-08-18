import generateUUID from '@shared/utils/uuid-generator';

import getDbQuery from '@infra/persistence/helpers/get-db-query';
import ledgerAccountBalanceRepo from '@infra/persistence/repos/ledger/ledger-account-balance.repo.impl';
import ledgerAccountBalanceMapper from '@infra/persistence/repos/ledger/mappers/ledger-account-balance.mapper';

jest.mock('../../../helpers/get-db-query');
jest.mock('../mappers/ledger-account-balance.mapper');

describe('ledgerAccountBalanceRepo findAllByAccountIds', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the requested balances', async () => {
    const databaseRow = { ledgerAccountId: generateUUID() };
    const domainBalance = { ledgerAccountId: databaseRow.ledgerAccountId };
    const where = jest.fn().mockResolvedValue([databaseRow]);
    const secondJoin = jest.fn().mockReturnValue({ where });
    const firstJoin = jest.fn().mockReturnValue({ innerJoin: secondJoin });
    const from = jest.fn().mockReturnValue({ innerJoin: firstJoin });
    const select = jest.fn().mockReturnValue({ from });
    (getDbQuery as jest.Mock).mockReturnValue({ select });
    (ledgerAccountBalanceMapper.toDomain as jest.Mock).mockReturnValue(
      domainBalance
    );

    const result = await ledgerAccountBalanceRepo.findAllByAccountIds(
      generateUUID(),
      [databaseRow.ledgerAccountId],
      { correlationId: generateUUID() }
    );

    expect(result).toEqual([domainBalance]);
  });

  it('returns immediately when no account IDs are requested', async () => {
    await expect(
      ledgerAccountBalanceRepo.findAllByAccountIds(generateUUID(), [], {
        correlationId: generateUUID(),
      })
    ).resolves.toEqual([]);

    expect(getDbQuery).not.toHaveBeenCalled();
  });
});
