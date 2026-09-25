import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';

import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import { EExchangeRateType } from '@domain/money/types/exchange-rate.types';
import moneyValue from '@domain/money/values/money.vo';
import fxCostBasisLotDispositionEntity from '@domain/subledger/fx-cost-basis/entities/disposition.entity';
import { EFxCostBasisLotDispositionAuditAction } from '@domain/subledger/fx-cost-basis/types/disposition.types';
import fxCostBasisLotDispositionAudit from '@domain/subledger/fx-cost-basis/values/disposition-audit.vo';

describe('fxCostBasisLotDispositionAudit', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates an immutable disposition audit from the resulting entity', () => {
    const [disposition] = fxCostBasisLotDispositionEntity.make({
      createdBy: 'a1111111-1111-4111-8111-111111111111' as TEntityId,
      ledgerAccountId: generateUUID(),
      accountingEntityId: generateUUID(),
      journalEntryId: generateUUID(),
      quantity: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
      costBasisConsumed: moneyValue.make(150000, SYSTEM_CURRENCIES.NGN, false),
      proceeds: moneyValue.make(160000, SYSTEM_CURRENCIES.NGN, false),
      realizedGainLoss: moneyValue.make(10000, SYSTEM_CURRENCIES.NGN, false),
      dispositionRate: {
        currencyPair: 'USD/NGN',
        baseCurrencyCode: 'USD',
        targetCurrencyCode: 'NGN',
        rate: 1600,
        type: EExchangeRateType.Negotiated,
        asOf: new Date('2026-03-31T00:00:00.000Z'),
        source: 'bank',
        createdAt: new Date('2026-03-31T00:00:00.000Z'),
      },
      officialRate: null,
      dispositionDate: new Date('2026-03-31T00:00:00.000Z'),
    });

    const audit = fxCostBasisLotDispositionAudit.make({
      before: null,
      after: disposition,
      action: EFxCostBasisLotDispositionAuditAction.Created,
    });

    expect(audit).toEqual({
      entityId: disposition.id,
      entityVersion: 1,
      action: EFxCostBasisLotDispositionAuditAction.Created,
      diff: { before: null, after: disposition },
      occurredAt: disposition.createdAt,
    });
    expect(Object.isFrozen(audit)).toBe(true);
  });
});
