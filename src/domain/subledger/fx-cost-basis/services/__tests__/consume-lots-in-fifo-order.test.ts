import generateUUID from '@shared/utils/uuid-generator';

import { IJournalLine } from '@domain/journal-entry/types/journal-line.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import { EExchangeRateType } from '@domain/money/types/exchange-rate.types';
import moneyValue from '@domain/money/values/money.vo';
import fxCostBasisLotEntity from '@domain/subledger/fx-cost-basis/entities/lot.entity';
import fxCostBasisLotError from '@domain/subledger/fx-cost-basis/errors/lot.error';
import consumeLotsInFifoOrder from '@domain/subledger/fx-cost-basis/services/consume-lots-in-fifo-order';
import { EFxCostBasisLotStatus } from '@domain/subledger/fx-cost-basis/types/lot.types';

describe('consumeLotsInFifoOrder', () => {
  const date = new Date('2026-08-01T00:00:00.000Z');
  const accountId = generateUUID();
  const entityId = generateUUID();
  const dispositionRate = {
    currencyPair: 'USD/NGN',
    baseCurrencyCode: SYSTEM_CURRENCIES.USD.code,
    targetCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
    rate: 1500,
    type: EExchangeRateType.Negotiated,
    asOf: date,
    source: 'bank',
    createdAt: date,
  };

  function makeJournalLine(quantity: number): IJournalLine {
    const amount = moneyValue.make(quantity, SYSTEM_CURRENCIES.USD, false);

    return {
      id: generateUUID(),
      entryId: generateUUID(),
      accountId,
      counterpartyId: null,
      sequenceOrder: 1,
      amount,
      exchangeRate: dispositionRate,
      functionalAmount: moneyValue.convert(
        amount,
        dispositionRate,
        SYSTEM_CURRENCIES.NGN
      ),
      side: 'credit',
      description: null,
      meta: null,
      version: 1,
      createdAt: date,
      updatedAt: date,
    };
  }

  function makeLot(
    originalQuantity: number,
    remainingQuantity: number,
    costBasis: number,
    remainingCostBasis: number,
    acquisitionRate: number
  ) {
    return fxCostBasisLotEntity.make({
      ledgerAccountId: accountId,
      accountingEntityId: entityId,
      status: EFxCostBasisLotStatus.Open,
      originalQuantity: moneyValue.make(
        originalQuantity,
        SYSTEM_CURRENCIES.USD,
        false
      ),
      remainingQuantity: moneyValue.make(
        remainingQuantity,
        SYSTEM_CURRENCIES.USD,
        false
      ),
      costBasis: moneyValue.make(costBasis, SYSTEM_CURRENCIES.NGN, false),
      remainingCostBasis: moneyValue.make(
        remainingCostBasis,
        SYSTEM_CURRENCIES.NGN,
        false
      ),
      acquisitionRate: { ...dispositionRate, rate: acquisitionRate },
      acquisitionDate: date,
    })[0];
  }

  it('consumes the supplied lots in order and reconciles allocation totals', () => {
    const firstLot = makeLot(60, 60, 84_000, 84_000, 1400);
    const secondLot = makeLot(50, 50, 72_500, 72_500, 1450);
    const unusedLot = makeLot(20, 20, 30_000, 30_000, 1500);
    const journalLine = makeJournalLine(100);

    const result = consumeLotsInFifoOrder(
      [firstLot, secondLot, unusedLot],
      journalLine
    );

    expect(result.lots).toHaveLength(2);
    expect(result.lots[0][0].status).toBe(EFxCostBasisLotStatus.Closed);
    expect(result.lots[1][0].remainingQuantity).toEqual(
      moneyValue.make(10, SYSTEM_CURRENCIES.USD, false)
    );
    expect(result.costBasisConsumed).toEqual(
      moneyValue.make(142_000, SYSTEM_CURRENCIES.NGN, false)
    );
    expect(
      moneyValue.add(
        ...result.allocationSegments.map(({ proceeds }) => proceeds)
      )
    ).toEqual(journalLine.functionalAmount);
  });

  it('consumes the exact remaining basis when closing a partially used lot', () => {
    const lot = makeLot(100, 10, 140_000, 13_999, 1400);

    const result = consumeLotsInFifoOrder([lot], makeJournalLine(10));

    expect(result.costBasisConsumed).toEqual(lot.remainingCostBasis);
    expect(result.lots[0][0]).toMatchObject({
      status: EFxCostBasisLotStatus.Closed,
      remainingQuantity: moneyValue.makeZeroAmount(SYSTEM_CURRENCIES.USD),
      remainingCostBasis: moneyValue.makeZeroAmount(SYSTEM_CURRENCIES.NGN),
    });
  });

  it('rejects the operation when the supplied lots cannot cover the quantity', () => {
    const lot = makeLot(60, 60, 84_000, 84_000, 1400);

    expect(() => consumeLotsInFifoOrder([lot], makeJournalLine(100))).toThrow(
      fxCostBasisLotError.InsufficientQuantity
    );
  });
});
