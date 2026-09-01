import generateUUID from '@shared/utils/uuid-generator';

import { IFxCostBasisLot } from '@domain/subledger/fx-cost-basis/types/lot.types';

import getDbQuery from '@infra/persistence/helpers/get-db-query';
import fxCostBasisLotRepo from '@infra/persistence/repos/subledger/fx-cost-basis/lot.repo.impl';
import fxCostBasisLotHistoryMapper from '@infra/persistence/repos/subledger/fx-cost-basis/mappers/lot-history.mapper';
import fxCostBasisLotMapper from '@infra/persistence/repos/subledger/fx-cost-basis/mappers/lot.mapper';

jest.mock('../../../../helpers/get-db-query');
jest.mock('../mappers/lot.mapper');
jest.mock('../mappers/lot-history.mapper');

describe('FX Cost-Basis Lot Repo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads open account lots in repository FIFO order', async () => {
    const row = { id: 'row' };
    const lot = { id: generateUUID() } as IFxCostBasisLot;
    const orderedQuery = {
      then: (resolve: (value: unknown[]) => void) => resolve([row]),
    };
    const orderBy = jest.fn().mockReturnValue(orderedQuery);
    const where = jest.fn().mockReturnValue({ orderBy });
    const from = jest.fn().mockReturnValue({ where });
    const select = jest.fn().mockReturnValue({ from });
    jest.mocked(getDbQuery).mockReturnValue({
      select,
    } as unknown as ReturnType<typeof getDbQuery>);
    jest.mocked(fxCostBasisLotMapper.toDomain).mockReturnValue(lot);
    const accountingEntityId = generateUUID();
    const accountId = generateUUID();
    const options = { correlationId: 'corr-id' };

    await expect(
      fxCostBasisLotRepo.findOpenByAccountId(
        accountingEntityId,
        accountId,
        options
      )
    ).resolves.toEqual([lot]);

    expect(getDbQuery).toHaveBeenCalledWith(options);
    expect(orderBy).toHaveBeenCalledTimes(1);
    expect(jest.mocked(fxCostBasisLotMapper.toDomain).mock.calls[0][0]).toBe(
      row
    );
  });

  it('updates a lot and appends its history in one repository transaction', async () => {
    const lot = { id: generateUUID() } as IFxCostBasisLot;
    const history = { entityId: lot.id } as any;
    const lotRow = { id: lot.id } as any;
    const historyRow = { lotId: lot.id } as any;
    const where = jest.fn().mockResolvedValue(undefined);
    const set = jest.fn().mockReturnValue({ where });
    const update = jest.fn().mockReturnValue({ set });
    const values = jest.fn().mockResolvedValue(undefined);
    const insert = jest.fn().mockReturnValue({ values });
    const tx = { update, insert };
    jest.mocked(getDbQuery).mockReturnValue({
      transaction: jest.fn(async (callback) => callback(tx as any)),
    } as unknown as ReturnType<typeof getDbQuery>);
    jest.mocked(fxCostBasisLotMapper.toRepo).mockReturnValue(lotRow);
    jest.mocked(fxCostBasisLotHistoryMapper.toRepo).mockReturnValue(historyRow);

    await fxCostBasisLotRepo.update(lot, {
      correlationId: 'corr-id',
      history,
    });

    expect(set).toHaveBeenCalledWith(lotRow);
    expect(where).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith([historyRow]);
  });
});
