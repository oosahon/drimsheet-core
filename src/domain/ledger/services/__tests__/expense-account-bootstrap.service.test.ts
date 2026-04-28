import { IRepoOptions } from '../../../../app/contracts/infra/repo.contract';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../accounting-entity/types/accounting-entity.types';
import { ICurrency } from '../../../currency/types/currency.types';
import { IExpenseLedgerAccount } from '../../types/expense-account.types';
import { ELedgerType } from '../../types/ledger.types';
import expenseAccountService from '../expense-account-bootstrap.service';

describe('expenseAccountService', () => {
  const service = expenseAccountService(mockLedgerAccountRepo);
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

  const mockControlAccount = {
    id: '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
    type: ELedgerType.Expense,
    isControlAccount: true,
  } as unknown as IExpenseLedgerAccount;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('bootstrapIndividualHeaderAccounts', () => {
    it('should create all accounts when none exist', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

      const result = await service.bootstrapIndividualHeaderAccounts(
        accountingEntity,
        repoOptions
      );

      expect(result.length).toBe(6);
      expect(result[0][0].name).toBe('Direct Costs');
      expect(result[1][0].name).toBe('Rent and Utilities');
      expect(result[2][0].name).toBe('Finance Costs');
      expect(result[3][0].name).toBe('Tax Expense');
      expect(result[4][0].name).toBe('Unrealized Loss');
      expect(result[5][0].name).toBe('Asset Disposal Loss');
    });

    it('should not create accounts if they already exist', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(
        {} as IExpenseLedgerAccount
      );

      const result = await service.bootstrapIndividualHeaderAccounts(
        accountingEntity,
        repoOptions
      );

      expect(result.length).toBe(0);
    });
  });

  describe('bootstrapIndividualPostingAccounts', () => {
    it('should create non-power user accounts', async () => {
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([
        mockControlAccount,
      ]);
      mockLedgerAccountRepo.findByCode.mockResolvedValue(mockControlAccount);

      const result = await service.bootstrapIndividualPostingAccounts(
        accountingEntity,
        repoOptions
      );

      expect(result.length).toBe(6);
      expect(result[0][0].name).toBe('Direct Costs (Default)');
      expect(result[1][0].name).toBe('Rent and Utilities (Default)');
      expect(result[2][0].name).toBe('Finance Costs (Default)');
      expect(result[3][0].name).toBe('Tax Expense (Default)');
      expect(result[4][0].name).toBe('Unrealized Loss (Default)');
      expect(result[5][0].name).toBe('Asset Disposal Loss (Default)');

      expect(result[0][0].controlAccountId).toBe(mockControlAccount.id);
      expect(result[1][0].controlAccountId).toBe(mockControlAccount.id);
      expect(result[2][0].controlAccountId).toBe(mockControlAccount.id);
      expect(result[3][0].controlAccountId).toBe(mockControlAccount.id);
      expect(result[4][0].controlAccountId).toBe(mockControlAccount.id);
      expect(result[5][0].controlAccountId).toBe(mockControlAccount.id);
    });

    it('should not create accounts if they already exist (canBootstrap = false)', async () => {
      const mockExistingAccount = {
        ...mockControlAccount,
        isControlAccount: false,
      };
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([
        mockControlAccount,
        mockExistingAccount,
      ]);
      mockLedgerAccountRepo.findByCode.mockResolvedValue(mockControlAccount);

      const result = await service.bootstrapIndividualPostingAccounts(
        accountingEntity,
        repoOptions
      );

      expect(result.length).toBe(0);
    });
  });
});
