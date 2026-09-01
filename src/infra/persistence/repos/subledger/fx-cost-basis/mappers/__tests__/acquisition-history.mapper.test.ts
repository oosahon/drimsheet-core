import { TEntityId } from '@shared/types/uuid';
import { EHistoryActorType } from '@shared/values/history/types/history.types';

import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import moneyValue from '@domain/money/values/money.vo';
import { IFxCostBasisLotAcquisitionHistory } from '@domain/subledger/fx-cost-basis/types/acquisition.types';

import fxCostBasisLotAcquisitionHistoryMapper from '@infra/persistence/repos/subledger/fx-cost-basis/mappers/acquisition-history.mapper';

describe('FX Cost-Basis Lot Acquisition History Mapper', () => {
  it('maps acquisition history to the repository model', () => {
    const acquisitionId = 'acquisition-1' as TEntityId;
    const lotId = 'lot-1' as TEntityId;
    const accountingEntityId = 'accounting-entity-1' as TEntityId;
    const userId = 'user-1' as TEntityId;
    const occurredAt = new Date('2026-06-30T12:00:00.000Z');

    const history: IFxCostBasisLotAcquisitionHistory = {
      entityId: acquisitionId,
      entityVersion: 1,
      action: 'created',
      diff: {
        before: null,
        after: {
          id: acquisitionId,
          ledgerAccountId: 'ledger-account-1' as TEntityId,
          accountingEntityId,
          lotId,
          journalEntryId: 'journal-entry-1' as TEntityId,
          quantity: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
          costBasis: moneyValue.make(150000, SYSTEM_CURRENCIES.NGN, false),
          acquisitionRate: {
            currencyPair: 'USD/NGN',
            baseCurrencyCode: 'USD',
            targetCurrencyCode: 'NGN',
            rate: 1500,
            type: 'negotiated' as any,
            asOf: occurredAt,
            source: 'bank',
            createdAt: occurredAt,
          },
          acquisitionDate: occurredAt,
          officialRate: null,
          createdAt: occurredAt,
        },
      },
      occurredAt,
      actor: {
        type: EHistoryActorType.User,
        userId,
      },
      correlationId: 'correlation-id',
    };

    expect(fxCostBasisLotAcquisitionHistoryMapper.toRepo(history)).toEqual({
      acquisitionId,
      lotId,
      accountingEntityId,
      actorType: EHistoryActorType.User,
      action: history.action,
      userId,
      diff: history.diff,
      correlationId: history.correlationId,
      occurredAt: occurredAt.toISOString(),
    });
  });

  it('throws an error if lot ID cannot be found in the diff', () => {
    const history = {
      entityId: 'acquisition-1' as TEntityId,
      action: 'created',
      diff: {
        before: null,
        after: {
          accountingEntityId: 'accounting-entity-1' as TEntityId,
        }, // missing lotId
      },
      occurredAt: new Date(),
      actor: {
        type: EHistoryActorType.System,
        userId: null,
      },
      correlationId: 'correlation-id',
    } as unknown as IFxCostBasisLotAcquisitionHistory;

    expect(() =>
      fxCostBasisLotAcquisitionHistoryMapper.toRepo(history)
    ).toThrow('repo_error_missing_history_unexpected');
  });

  it('throws an error if accounting entity ID cannot be found in the diff', () => {
    const history = {
      entityId: 'acquisition-1' as TEntityId,
      action: 'created',
      diff: {
        before: null,
        after: {
          lotId: 'lot-1' as TEntityId,
        }, // missing accountingEntityId
      },
      occurredAt: new Date(),
      actor: {
        type: EHistoryActorType.System,
        userId: null,
      },
      correlationId: 'correlation-id',
    } as unknown as IFxCostBasisLotAcquisitionHistory;

    expect(() =>
      fxCostBasisLotAcquisitionHistoryMapper.toRepo(history)
    ).toThrow('repo_error_missing_history_unexpected');
  });
});
