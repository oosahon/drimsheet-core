import { IRepoOptions } from '../../../../app/contracts/infra/repo.contract';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../accounting-entity/types/accounting-entity.types';
import { ICurrency } from '../../../currency/types/currency.types';
import {
  IAssetLedgerAccount,
  IReceivablesAccount,
  IStatutoryReceivableAccount,
} from '../../types/asset-account.types';
import assetAccountService from '../asset-account.service';

describe('assetAccountService', () => {
  const service = assetAccountService(mockLedgerAccountRepo);
  const repoOptions: IRepoOptions = { correlationId: 'test-req' };
  const accountingEntityId =
    '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
  const ownerId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;

  const accountingEntity = {
    id: accountingEntityId,
    ownerId,
    type: EAccountingEntityType.Individual,
    functionalCurrency: { code: 'USD' } as unknown as ICurrency,
  } as unknown as IAccountingEntity;

  const mockReceivablesAccount = {
    id: '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
    code: '102000',
  } as unknown as IReceivablesAccount;

  const mockTradeReceivablesAccount = {
    id: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
    code: '102001',
  } as unknown as IReceivablesAccount;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setupBaseIndividualAccounts', () => {
    it('should create all accounts when none exist', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

      const result = await service.setupBaseIndividualAccounts(
        accountingEntity,
        repoOptions
      );

      expect(result.length).toBe(4);
      expect(result[0][0].name).toBe('Cash and Cash Equivalents');
      expect(result[1][0].name).toBe('Receivables');
      expect(result[2][0].name).toBe('Trade Receivables');
      expect(result[3][0].name).toBe('Statutory Receivables');
    });

    it('should not create accounts if they already exist', async () => {
      mockLedgerAccountRepo.findByCode.mockImplementation(async (code) => {
        if (code === '100000') return {} as IAssetLedgerAccount;
        if (code === '102000') return mockReceivablesAccount;
        if (code === '102001') return mockTradeReceivablesAccount;
        if (code === '102002') return {} as IAssetLedgerAccount;
        return null;
      });

      const result = await service.setupBaseIndividualAccounts(
        accountingEntity,
        repoOptions
      );

      expect(result.length).toBe(0);
    });
  });

  describe('bootstrapNonPowerUserAccounts', () => {
    const mockStatutoryReceivable = {
      id: '123e4567-e89b-12d3-a456-426614174005' as TEntityId,
      code: '102002',
    } as unknown as IStatutoryReceivableAccount;

    it('should create non-power user accounts', async () => {
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([]);
      mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
        mockStatutoryReceivable,
      ]);

      const result = await service.bootstrapNonPowerUserAccounts(
        accountingEntity,
        repoOptions
      );

      expect(result.length).toBe(2);
      expect(result[0][0].name).toBe('Asset Suspense Account');
      expect(result[1][0].name).toBe('Statutory Receivables (Default)');
      expect(result[1][0].controlAccountId).toBe(mockStatutoryReceivable.id);
    });

    it('should not create accounts if they already exist', async () => {
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([
        {} as IAssetLedgerAccount,
      ]);
      mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
        mockStatutoryReceivable,
        mockStatutoryReceivable,
      ]);

      const result = await service.bootstrapNonPowerUserAccounts(
        accountingEntity,
        repoOptions
      );

      expect(result.length).toBe(0);
    });

    it('should throw AppError if statutory receivables header account not found', async () => {
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([]);
      mockLedgerAccountRepo.findByBehavior.mockResolvedValue([]);

      await expect(
        service.bootstrapNonPowerUserAccounts(accountingEntity, repoOptions)
      ).rejects.toThrow(AppError);
    });
  });
});
