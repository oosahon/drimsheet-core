import { ICurrency } from '../../../currency/types/currency.types';
import { IRepoOptions } from '../../../../app/contracts/infra/repo.contract';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import ledgerService from '../ledger.service';
import generateUUID from '../../../../shared/utils/uuid-generator';

describe('Ledger Service', () => {
  const service = ledgerService(mockLedgerAccountRepo);

  const mockParams = {
    userId: generateUUID(),
    accountingEntityId: generateUUID(),
    functionalCurrency: {
      code: 'NGN',
      name: 'Naira',
      symbol: '₦',
      minorUnit: 2n,
    } as ICurrency,
  };

  const mockRepoOptions: IRepoOptions = { correlationId: generateUUID() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setupBaseIndividualAccounts', () => {
    it('should fetch from ledger account repo for each base account', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

      await service.setupBaseIndividualAccounts(mockParams, mockRepoOptions);

      expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledTimes(16);
    });

    it('should create all base accounts if none exist in the repository', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

      const result = await service.setupBaseIndividualAccounts(
        mockParams,
        mockRepoOptions
      );

      const codes = result.map((r) => r[0].code);

      expect(result).toHaveLength(16);

      const expectedAssetCodes = ['100000', '102000'];
      const expectedLiabilityCodes = ['200000', '201000'];
      const expectedEquityCodes = ['301000', '399000'];
      const expectedRevenueCodes = ['401000', '403000', '405000', '406000'];
      const expectedExpenseCodes = [
        '500000',
        '502000',
        '507000',
        '508000',
        '509000',
        '510000',
      ];

      const expectedCodes = [
        ...expectedAssetCodes,
        ...expectedLiabilityCodes,
        ...expectedEquityCodes,
        ...expectedRevenueCodes,
        ...expectedExpenseCodes,
      ];

      expect(codes).toEqual(expect.arrayContaining(expectedCodes));
    });

    it('should return no accounts if they all already exist', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue({
        id: generateUUID(),
      } as any);

      const result = await service.setupBaseIndividualAccounts(
        mockParams,
        mockRepoOptions
      );

      expect(result).toHaveLength(0);
    });

    it('should only create accounts that do not exist', async () => {
      mockLedgerAccountRepo.findByCode.mockImplementation(async (code) => {
        const existingCodes = [
          '100000',
          '200000',
          '301000',
          '401000',
          '500000',
        ];

        if (existingCodes.includes(code)) {
          return { id: generateUUID() } as any;
        }

        return null;
      });

      const result = await service.setupBaseIndividualAccounts(
        mockParams,
        mockRepoOptions
      );

      const createdCodes = result.map((r) => r[0].code);

      const expectedAssetCodes = ['102000'];
      const expectedLiabilityCodes = ['201000'];
      const expectedEquityCodes = ['399000'];
      const expectedRevenueCodes = ['403000', '405000', '406000'];
      const expectedExpenseCodes = [
        '502000',
        '507000',
        '508000',
        '509000',
        '510000',
      ];

      const expectedCodes = [
        ...expectedAssetCodes,
        ...expectedLiabilityCodes,
        ...expectedEquityCodes,
        ...expectedRevenueCodes,
        ...expectedExpenseCodes,
      ];

      expect(result).toHaveLength(expectedCodes.length);
      expect(createdCodes).toEqual(expect.arrayContaining(expectedCodes));
    });
  });
});
