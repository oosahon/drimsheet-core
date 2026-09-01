import generateUUID from '@shared/utils/uuid-generator';

import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import { EExchangeRateType } from '@domain/money/types/exchange-rate.types';
import moneyValue from '@domain/money/values/money.vo';
import fxCostBasisLotAcquisitionEntity from '@domain/subledger/fx-cost-basis/entities/acquisition.entity';
import { EFxCostBasisLotAcquisitionAuditAction } from '@domain/subledger/fx-cost-basis/types/acquisition.types';
import fxCostBasisLotAcquisitionAudit from '@domain/subledger/fx-cost-basis/values/acquisition-audit.vo';

describe('fxCostBasisLotAcquisitionAudit', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates an immutable acquisition audit from the resulting entity', () => {
    const [acquisition] = fxCostBasisLotAcquisitionEntity.make({
      ledgerAccountId: generateUUID(),
      accountingEntityId: generateUUID(),
      lotId: generateUUID(),
      journalEntryId: generateUUID(),
      quantity: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
      costBasis: moneyValue.make(150000, SYSTEM_CURRENCIES.NGN, false),
      acquisitionRate: {
        currencyPair: 'USD/NGN',
        baseCurrencyCode: 'USD',
        targetCurrencyCode: 'NGN',
        rate: 1500,
        type: EExchangeRateType.Negotiated,
        asOf: new Date('2026-03-31T00:00:00.000Z'),
        source: 'bank',
        createdAt: new Date('2026-03-31T00:00:00.000Z'),
      },
      acquisitionDate: new Date('2026-03-31T00:00:00.000Z'),
      officialRate: null,
    });

    const audit = fxCostBasisLotAcquisitionAudit.make({
      before: null,
      after: acquisition,
      action: EFxCostBasisLotAcquisitionAuditAction.Created,
    });

    expect(audit).toEqual({
      entityId: acquisition.id,
      entityVersion: 1,
      action: EFxCostBasisLotAcquisitionAuditAction.Created,
      diff: { before: null, after: acquisition },
      occurredAt: acquisition.createdAt,
    });
    expect(Object.isFrozen(audit)).toBe(true);
  });
});
