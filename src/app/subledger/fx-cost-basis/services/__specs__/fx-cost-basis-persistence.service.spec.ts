import { SYSTEM_CURRENCIES } from '../../../../../domain/money/config/currencies.config';
import { EExchangeRateType } from '../../../../../domain/money/types/exchange-rate.types';
import moneyValue from '../../../../../domain/money/values/money.vo';
import fxCostBasisLotAcquisitionEntity from '../../../../../domain/subledger/fx-cost-basis/entities/acquisition.entity';
import fxCostBasisLotEntity from '../../../../../domain/subledger/fx-cost-basis/entities/lot.entity';
import mockFxCostBasisLotAcquisitionRepo from '../../../../../domain/subledger/fx-cost-basis/repos/__mocks__/acquisition.repo.impl.mock';
import mockFxCostBasisLotRepo from '../../../../../domain/subledger/fx-cost-basis/repos/__mocks__/lot.repo.impl.mock';
import { EFxCostBasisLotStatus } from '../../../../../domain/subledger/fx-cost-basis/types/lot.types';
import mockRepoService from '../../../../../shared/contracts/__mocks__/repo.mock';
import historyValue from '../../../../../shared/history/history.vo';
import { EHistoryActorType } from '../../../../../shared/history/types/history.types';
import { ITransactionContext } from '../../../../../shared/types/repo.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import makeFxLotCostBasisPersistenceService from '../fx-cost-basis-persistence.service';

describe('fxCostBasisPersistenceService', () => {
  const correlationId = 'test-corr-id';
  const actor = {
    type: EHistoryActorType.User,
    userId: generateUUID() as TEntityId,
  };
  const mockDate = new Date('2026-03-14T00:00:00.000Z');

  const mockRate = {
    currencyPair: 'USD/NGN',
    baseCurrencyCode: 'USD',
    targetCurrencyCode: 'NGN',
    rate: 1500,
    type: EExchangeRateType.Negotiated,
    asOf: mockDate,
    source: 'bank',
    createdAt: mockDate,
  };

  const getService = () =>
    makeFxLotCostBasisPersistenceService({
      lotRepo: mockFxCostBasisLotRepo,
      acquisitionRepo: mockFxCostBasisLotAcquisitionRepo,
      repoService: mockRepoService,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepoService.runInTransaction
      .mockReset()
      .mockImplementation(async (transactionFn) =>
        transactionFn('mock-tx' as unknown as ITransactionContext)
      );
  });

  it('should successfully persist lot and acquisition in transaction when invariants are met', async () => {
    const service = getService();

    const [mockLot, mockLotEvents, mockLotAudit] = fxCostBasisLotEntity.make({
      ledgerAccountId: generateUUID(),
      accountingEntityId: generateUUID(),
      status: EFxCostBasisLotStatus.Open,
      originalQuantity: moneyValue.make(1000, SYSTEM_CURRENCIES.USD, true),
      remainingQuantity: moneyValue.make(1000, SYSTEM_CURRENCIES.USD, true),
      costBasis: moneyValue.make(1500000, SYSTEM_CURRENCIES.NGN, true),
      remainingCostBasis: moneyValue.make(1500000, SYSTEM_CURRENCIES.NGN, true),
      acquisitionRate: mockRate,
      acquisitionDate: mockDate,
    });

    const [mockAcquisition, mockAcquisitionEvents, mockAcquisitionAudit] =
      fxCostBasisLotAcquisitionEntity.make({
        ledgerAccountId: mockLot.ledgerAccountId,
        accountingEntityId: mockLot.accountingEntityId,
        lotId: mockLot.id,
        journalEntryId: generateUUID(),
        quantity: moneyValue.make(1000, SYSTEM_CURRENCIES.USD, true),
        costBasis: moneyValue.make(1500000, SYSTEM_CURRENCIES.NGN, true),
        acquisitionRate: mockRate,
        officialRate: mockRate,
        acquisitionDate: mockDate,
      });

    const lotHistory = historyValue.make(mockLotAudit, actor, correlationId);
    const acquisitionHistory = historyValue.make(
      mockAcquisitionAudit,
      actor,
      correlationId
    );

    const repoOptions = { correlationId };

    await service.persistAcquisition(
      mockLot,
      mockAcquisition,
      lotHistory,
      acquisitionHistory,
      repoOptions
    );

    expect(mockFxCostBasisLotRepo.create).toHaveBeenCalledWith(
      mockLot,
      expect.objectContaining({
        correlationId,
        tx: 'mock-tx',
        history: lotHistory,
      })
    );

    expect(mockFxCostBasisLotAcquisitionRepo.create).toHaveBeenCalledWith(
      mockAcquisition,
      expect.objectContaining({
        correlationId,
        tx: 'mock-tx',
        history: acquisitionHistory,
      })
    );
  });

  it('should throw MalformedAcquisition if cost basis differs between lot and acquisition', async () => {
    const service = getService();

    const [mockLot, , mockLotAudit] = fxCostBasisLotEntity.make({
      ledgerAccountId: generateUUID(),
      accountingEntityId: generateUUID(),
      status: EFxCostBasisLotStatus.Open,
      originalQuantity: moneyValue.make(1000, SYSTEM_CURRENCIES.USD, true),
      remainingQuantity: moneyValue.make(1000, SYSTEM_CURRENCIES.USD, true),
      costBasis: moneyValue.make(1500000, SYSTEM_CURRENCIES.NGN, true),
      remainingCostBasis: moneyValue.make(1500000, SYSTEM_CURRENCIES.NGN, true),
      acquisitionRate: mockRate,
      acquisitionDate: mockDate,
    });

    const [mockAcquisition, , mockAcquisitionAudit] =
      fxCostBasisLotAcquisitionEntity.make({
        ledgerAccountId: mockLot.ledgerAccountId,
        accountingEntityId: mockLot.accountingEntityId,
        lotId: mockLot.id,
        journalEntryId: generateUUID(),
        quantity: moneyValue.make(1000, SYSTEM_CURRENCIES.USD, true),
        costBasis: moneyValue.make(1600000, SYSTEM_CURRENCIES.NGN, true), // Differs
        acquisitionRate: mockRate,
        officialRate: mockRate,
        acquisitionDate: mockDate,
      });

    const lotHistory = historyValue.make(mockLotAudit, actor, correlationId);
    const acquisitionHistory = historyValue.make(
      mockAcquisitionAudit,
      actor,
      correlationId
    );

    await expect(
      service.persistAcquisition(
        mockLot,
        mockAcquisition,
        lotHistory,
        acquisitionHistory,
        { correlationId }
      )
    ).rejects.toThrow('app_error_fx_cost_basis_malformed_acquisition');
  });

  it('should throw MalformedAcquisition if quantity differs between lot and acquisition', async () => {
    const service = getService();

    const [mockLot, , mockLotAudit] = fxCostBasisLotEntity.make({
      ledgerAccountId: generateUUID(),
      accountingEntityId: generateUUID(),
      status: EFxCostBasisLotStatus.Open,
      originalQuantity: moneyValue.make(1000, SYSTEM_CURRENCIES.USD, true),
      remainingQuantity: moneyValue.make(1000, SYSTEM_CURRENCIES.USD, true),
      costBasis: moneyValue.make(1500000, SYSTEM_CURRENCIES.NGN, true),
      remainingCostBasis: moneyValue.make(1500000, SYSTEM_CURRENCIES.NGN, true),
      acquisitionRate: mockRate,
      acquisitionDate: mockDate,
    });

    const [mockAcquisition, , mockAcquisitionAudit] =
      fxCostBasisLotAcquisitionEntity.make({
        ledgerAccountId: mockLot.ledgerAccountId,
        accountingEntityId: mockLot.accountingEntityId,
        lotId: mockLot.id,
        journalEntryId: generateUUID(),
        quantity: moneyValue.make(1100, SYSTEM_CURRENCIES.USD, true), // Differs
        costBasis: moneyValue.make(1500000, SYSTEM_CURRENCIES.NGN, true),
        acquisitionRate: mockRate,
        officialRate: mockRate,
        acquisitionDate: mockDate,
      });

    const lotHistory = historyValue.make(mockLotAudit, actor, correlationId);
    const acquisitionHistory = historyValue.make(
      mockAcquisitionAudit,
      actor,
      correlationId
    );

    await expect(
      service.persistAcquisition(
        mockLot,
        mockAcquisition,
        lotHistory,
        acquisitionHistory,
        { correlationId }
      )
    ).rejects.toThrow('app_error_fx_cost_basis_malformed_acquisition');
  });
});
