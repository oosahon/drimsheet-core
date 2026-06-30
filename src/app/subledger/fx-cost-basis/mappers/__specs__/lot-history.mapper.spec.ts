import { SYSTEM_CURRENCIES } from '../../../../../domain/currency/config/currencies.config';
import {
  EFxCostBasisLotStatus,
  IFxCostBasisLotHistory,
} from '../../../../../domain/subledger/fx-cost-basis/types/lot.types';
import { EHistoryActorType } from '../../../../../shared/types/history.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import moneyValue from '../../../../../shared/value-objects/money.vo';
import fxCostBasisLotHistoryMapper from '../lot-history.mapper';

describe('FX Cost-Basis Lot History Mapper', () => {
  it('maps lot history to the repository model', () => {
    const lotId = 'lot-1' as TEntityId;
    const accountingEntityId = 'accounting-entity-1' as TEntityId;
    const userId = 'user-1' as TEntityId;
    const occurredAt = new Date('2026-06-30T12:00:00.000Z');

    const history: IFxCostBasisLotHistory = {
      entityId: lotId,
      action: 'created',
      diff: {
        before: null,
        after: {
          id: lotId,
          ledgerAccountId: 'ledger-account-1' as TEntityId,
          accountingEntityId,
          status: EFxCostBasisLotStatus.Open,
          originalQuantity: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
          remainingQuantity: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
          costBasis: moneyValue.make(150000, SYSTEM_CURRENCIES.NGN, false),
          remainingCostBasis: moneyValue.make(
            150000,
            SYSTEM_CURRENCIES.NGN,
            false
          ),
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
          version: 1,
          createdAt: occurredAt,
          updatedAt: occurredAt,
        },
      },
      occurredAt,
      actor: {
        type: EHistoryActorType.User,
        userId,
      },
      correlationId: 'correlation-id',
    };

    expect(fxCostBasisLotHistoryMapper.toRepo(history)).toEqual({
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

  it('throws an error if accounting entity ID cannot be found in the diff', () => {
    const history = {
      entityId: 'lot-1' as TEntityId,
      action: 'created',
      diff: {
        before: null,
        after: null, // intentionally missing to trigger error
      },
      occurredAt: new Date(),
      actor: {
        type: EHistoryActorType.System,
        userId: null,
      },
      correlationId: 'correlation-id',
    } as unknown as IFxCostBasisLotHistory;

    expect(() => fxCostBasisLotHistoryMapper.toRepo(history)).toThrow(
      'Accounting Entity ID is required in lot history diff'
    );
  });
});
