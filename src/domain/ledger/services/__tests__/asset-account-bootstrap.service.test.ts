import { IRepoOptions } from '../../../../app/contracts/infra/repo.contract';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import { EAccountingEntityType } from '../../../accounting-entity/types/accounting-entity.types';
import assetAccountService from '../asset-account-bootstrap.service';

describe('assetAccountService', () => {
  const service = assetAccountService(mockLedgerAccountRepo);
  const repoOptions: IRepoOptions = { correlationId: 'test-req' };
  const accountingEntityId =
    '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
  const ownerId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;

  const accountingEntity = {
    accountingContextId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
    id: accountingEntityId,
    ownerId,
    type: EAccountingEntityType.Individual,
    functionalCurrency: { code: 'USD' },
  };

  const mockReceivablesAccount = {
    id: '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
    code: '102000',
  };

  const mockTradeReceivablesAccount = {
    id: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
    code: '102001',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('bootstrapIndividualHeaderAccounts', () => {
    it('should create all accounts when none exist', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

      const result = await service.bootstrapIndividualHeaderAccounts(
        // @ts-expect-error - partial object testing
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
      // @ts-expect-error - partial objects used for testing mock resolve values
      mockLedgerAccountRepo.findByCode.mockImplementation(async (code) => {
        if (code === '100000') return { code: '100000' };
        if (code === '102000') return mockReceivablesAccount;
        if (code === '102001') return mockTradeReceivablesAccount;
        if (code === '102002') return { code: '102002' };
        return null;
      });

      const result = await service.bootstrapIndividualHeaderAccounts(
        // @ts-expect-error - partial object testing
        accountingEntity,
        repoOptions
      );

      expect(result.length).toBe(0);
    });
  });

  describe('bootstrapIndividualPostingAccounts', () => {
    const mockStatutoryReceivable = {
      id: '123e4567-e89b-12d3-a456-426614174005' as TEntityId,
      code: '102002',
    };

    it('should create non-power user accounts', async () => {
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([]);
      mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
        // @ts-expect-error - partial object mock
        mockStatutoryReceivable,
      ]);

      const result = await service.bootstrapIndividualPostingAccounts(
        // @ts-expect-error - partial object testing
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
        // @ts-expect-error - partial object return
        { code: 'suspense' },
      ]);
      mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
        // @ts-expect-error - partial object mock
        mockStatutoryReceivable,
        // @ts-expect-error - partial object mock
        mockStatutoryReceivable,
      ]);

      const result = await service.bootstrapIndividualPostingAccounts(
        // @ts-expect-error - partial object testing
        accountingEntity,
        repoOptions
      );

      expect(result.length).toBe(0);
    });

    it('should throw AppError if statutory receivables header account not found', async () => {
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([]);
      mockLedgerAccountRepo.findByBehavior.mockResolvedValue([]);

      await expect(
        service.bootstrapIndividualPostingAccounts(
          // @ts-expect-error - partial object testing
          accountingEntity,
          repoOptions
        )
      ).rejects.toThrow(AppError);
    });
  });
});
