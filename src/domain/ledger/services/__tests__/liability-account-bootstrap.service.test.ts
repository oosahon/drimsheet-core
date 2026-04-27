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
  ILiabilityLedgerAccount,
  IPayableAccount,
  IStatutoryPayableAccount,
} from '../../types/liability-account.types';
import liabilityAccountService from '../liability-account-bootstrap.service';

describe('liabilityAccountService', () => {
  const service = liabilityAccountService(mockLedgerAccountRepo);
  const repoOptions: IRepoOptions = { correlationId: 'test-req' };
  const accountingEntityId =
    '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
  const ownerId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;

  const accountingEntity = {
    accountingContextId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
    id: accountingEntityId,
    ownerId,
    type: EAccountingEntityType.Individual,
    functionalCurrency: { code: 'USD' } as unknown as ICurrency,
  } as unknown as IAccountingEntity;

  const mockPayablesAccount = {
    id: '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
    code: '201000',
  } as unknown as IPayableAccount;

  const mockTradePayablesAccount = {
    id: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
    code: '201001',
  } as unknown as IPayableAccount;

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

      expect(result.length).toBe(4);
      expect(result[0][0].name).toBe('Short Term Loans');
      expect(result[1][0].name).toBe('Payables');
      expect(result[2][0].name).toBe('Trade Payables');
      expect(result[3][0].name).toBe('Statutory Payables');
    });

    it('should not create accounts if they already exist', async () => {
      mockLedgerAccountRepo.findByCode.mockImplementation(async (code) => {
        if (code === '200000') return {} as ILiabilityLedgerAccount;
        if (code === '201000') return mockPayablesAccount;
        if (code === '201001') return mockTradePayablesAccount;
        if (code === '201002') return {} as ILiabilityLedgerAccount;
        return null;
      });

      const result = await service.bootstrapIndividualHeaderAccounts(
        accountingEntity,
        repoOptions
      );

      expect(result.length).toBe(0);
    });
  });

  describe('bootstrapIndividualPostingAccounts', () => {
    const mockStatutoryPayable = {
      id: '123e4567-e89b-12d3-a456-426614174005' as TEntityId,
      code: '201002',
    } as unknown as IStatutoryPayableAccount;

    it('should create non-power user accounts', async () => {
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([]);
      mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
        mockStatutoryPayable,
      ]);

      const result = await service.bootstrapIndividualPostingAccounts(
        accountingEntity,
        repoOptions
      );

      expect(result.length).toBe(2);
      expect(result[0][0].name).toBe('Liability Suspense Account');
      expect(result[1][0].name).toBe('Statutory Payables (Default)');
      expect(result[1][0].controlAccountId).toBe(mockStatutoryPayable.id);
    });

    it('should not create accounts if they already exist', async () => {
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([
        {} as ILiabilityLedgerAccount,
      ]);
      mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
        mockStatutoryPayable,
        mockStatutoryPayable,
      ]);

      const result = await service.bootstrapIndividualPostingAccounts(
        accountingEntity,
        repoOptions
      );

      expect(result.length).toBe(0);
    });

    it('should throw AppError if statutory payables header account not found', async () => {
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([]);
      mockLedgerAccountRepo.findByBehavior.mockResolvedValue([]);

      await expect(
        service.bootstrapIndividualPostingAccounts(
          accountingEntity,
          repoOptions
        )
      ).rejects.toThrow(AppError);
    });
  });
});
