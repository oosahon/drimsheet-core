import generateUUID from '@shared/utils/uuid-generator';

import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import { EExchangeRateType } from '@domain/money/types/exchange-rate.types';
import moneyValue from '@domain/money/values/money.vo';
import fxCostBasisLotEntity from '@domain/subledger/fx-cost-basis/entities/lot.entity';
import {
  EFxCostBasisLotAuditAction,
  EFxCostBasisLotStatus,
} from '@domain/subledger/fx-cost-basis/types/lot.types';
import fxCostBasisLotAudit from '@domain/subledger/fx-cost-basis/values/lot-audit.vo';

describe('fxCostBasisLotAudit', () => {
  const createdAt = new Date('2026-04-01T00:00:00.000Z');
  const makePayload: Parameters<typeof fxCostBasisLotEntity.make>[0] = {
    ledgerAccountId: generateUUID(),
    accountingEntityId: generateUUID(),
    status: EFxCostBasisLotStatus.Open,
    originalQuantity: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
    remainingQuantity: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
    costBasis: moneyValue.make(150000, SYSTEM_CURRENCIES.NGN, false),
    remainingCostBasis: moneyValue.make(150000, SYSTEM_CURRENCIES.NGN, false),
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
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(createdAt);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates an immutable lot creation audit from the resulting entity', () => {
    const [lot] = fxCostBasisLotEntity.make(makePayload);

    const audit = fxCostBasisLotAudit.make({
      before: null,
      after: lot,
      action: EFxCostBasisLotAuditAction.Created,
    });

    expect(audit).toEqual({
      entityId: lot.id,
      entityVersion: lot.version,
      action: EFxCostBasisLotAuditAction.Created,
      diff: { before: null, after: lot },
      occurredAt: lot.updatedAt,
    });
    expect(Object.isFrozen(audit)).toBe(true);
  });

  it('creates a lot transition audit from the before and after snapshots', () => {
    const [lot] = fxCostBasisLotEntity.make(makePayload);
    jest.setSystemTime(new Date('2026-04-02T00:00:00.000Z'));
    const [updatedLot] = fxCostBasisLotEntity.consume(
      lot,
      moneyValue.make(40, SYSTEM_CURRENCIES.USD, false),
      moneyValue.make(60000, SYSTEM_CURRENCIES.NGN, false)
    );

    const audit = fxCostBasisLotAudit.make({
      before: lot,
      after: updatedLot,
      action: EFxCostBasisLotAuditAction.Disposed,
    });

    expect(audit).toEqual({
      entityId: updatedLot.id,
      entityVersion: updatedLot.version,
      action: EFxCostBasisLotAuditAction.Disposed,
      diff: { before: lot, after: updatedLot },
      occurredAt: updatedLot.updatedAt,
    });
    expect(Object.isFrozen(audit)).toBe(true);
  });
});
