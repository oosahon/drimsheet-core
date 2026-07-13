import moneyValue from '../../../../../domain/money/values/money.vo';
import { TCreationOmits } from '../../../../../shared/types/creation-omits.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import { SYSTEM_CURRENCIES } from '../../../../money/config/currencies.config';
import {
  EExchangeRateType,
  IExchangeRate,
} from '../../../../money/types/exchange-rate.types';
import fxCostBasisLotAcquisitionError from '../../errors/acquisition.error';
import fxCostBasisLotError from '../../errors/lot.error';
import { IFxCostBasisLotAcquisition } from '../../types/acquisition.types';
import { EFxCostBasisLotStatus } from '../../types/lot.types';
import makeFxCostBasisLotService from '../lot.service';

describe('makeFxCostBasisLotService', () => {
  const service = makeFxCostBasisLotService();
  const MOCK_DATE = new Date('2026-04-01T00:00:00.000Z');
  let acquisitionRate: IExchangeRate;
  let officialRate: IExchangeRate;
  let validPayload: TCreationOmits<IFxCostBasisLotAcquisition>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_DATE);

    acquisitionRate = {
      currencyPair: 'USD/NGN',
      baseCurrencyCode: 'USD',
      targetCurrencyCode: 'NGN',
      rate: 1500,
      type: EExchangeRateType.Negotiated,
      asOf: new Date('2026-03-31T00:00:00.000Z'),
      source: 'bank',
      createdAt: new Date('2026-03-31T00:00:00.000Z'),
    };

    officialRate = {
      currencyPair: 'USD/NGN',
      baseCurrencyCode: 'USD',
      targetCurrencyCode: 'NGN',
      rate: 1490,
      type: EExchangeRateType.Official,
      asOf: new Date('2026-03-31T00:00:00.000Z'),
      source: 'central bank',
      createdAt: new Date('2026-03-31T00:00:00.000Z'),
    };

    validPayload = {
      ledgerAccountId: generateUUID(),
      accountingEntityId: generateUUID(),
      lotId: generateUUID(),
      journalEntryId: generateUUID(),
      quantity: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
      costBasis: moneyValue.make(150000, SYSTEM_CURRENCIES.NGN, false),
      acquisitionRate,
      officialRate,
      acquisitionDate: new Date('2026-03-31T00:00:00.000Z'),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('acquire', () => {
    it('should successfully acquires a lot and acquisition when given a valid payload', () => {
      const result = service.acquire(validPayload);

      expect(result.lot).toBeDefined();
      expect(result.acquisition).toBeDefined();

      const [lotEntity, lotEvents, lotAudit] = result.lot;
      const [acquisitionEntity, acquisitionEvents, acquisitionAudit] =
        result.acquisition;

      // Verify lot entity properties
      expect(lotEntity.id).toBeDefined();
      expect(lotEntity.ledgerAccountId).toBe(validPayload.ledgerAccountId);
      expect(lotEntity.accountingEntityId).toBe(
        validPayload.accountingEntityId
      );
      expect(lotEntity.status).toBe(EFxCostBasisLotStatus.Open);
      expect(lotEntity.originalQuantity).toEqual(validPayload.quantity);
      expect(lotEntity.remainingQuantity).toEqual(validPayload.quantity);
      expect(lotEntity.costBasis).toEqual(validPayload.costBasis);
      expect(lotEntity.remainingCostBasis).toEqual(validPayload.costBasis);
      expect(lotEntity.acquisitionRate).toEqual(validPayload.acquisitionRate);
      expect(lotEntity.acquisitionDate).toEqual(validPayload.acquisitionDate);
      expect(lotEntity.createdAt).toEqual(MOCK_DATE);

      // Verify acquisition entity properties
      expect(acquisitionEntity.id).toBeDefined();
      expect(acquisitionEntity.ledgerAccountId).toBe(
        validPayload.ledgerAccountId
      );
      expect(acquisitionEntity.accountingEntityId).toBe(
        validPayload.accountingEntityId
      );
      expect(acquisitionEntity.lotId).toBe(lotEntity.id);
      expect(acquisitionEntity.journalEntryId).toBe(
        validPayload.journalEntryId
      );
      expect(acquisitionEntity.quantity).toEqual(validPayload.quantity);
      expect(acquisitionEntity.costBasis).toEqual(validPayload.costBasis);
      expect(acquisitionEntity.acquisitionRate).toEqual(
        validPayload.acquisitionRate
      );
      expect(acquisitionEntity.acquisitionDate).toEqual(
        validPayload.acquisitionDate
      );
      expect(acquisitionEntity.officialRate).toEqual(validPayload.officialRate);
      expect(acquisitionEntity.createdAt).toEqual(MOCK_DATE);
    });

    it('should throw fxCostBasisLotError.InvalidLedgerAccountId when ledgerAccountId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        ledgerAccountId: 'invalid-uuid',
      };

      expect(() => {
        // @ts-expect-error testing invalid UUID
        service.acquire(invalidPayload);
      }).toThrow(fxCostBasisLotError.InvalidLedgerAccountId);
    });

    it('should throw fxCostBasisLotAcquisitionError.InvalidJournalEntryId when journalEntryId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        journalEntryId: 'invalid-uuid',
      };

      expect(() => {
        // @ts-expect-error testing invalid UUID
        service.acquire(invalidPayload);
      }).toThrow(fxCostBasisLotAcquisitionError.InvalidJournalEntryId);
    });
  });
});
