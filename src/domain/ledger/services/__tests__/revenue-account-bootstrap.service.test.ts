import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import { IRepoOptions } from '../../../../shared/types/repo.types';
import { TEntityId } from '../../../../shared/types/uuid';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../accounting-entity/types/accounting-entity.types';
import { ICurrency } from '../../../currency/types/currency.types';
import { ELedgerType } from '../../types/ledger.types';
import { IRevenueLedgerAccount } from '../../types/revenue-account.types';
import revenueAccountService from '../revenue-account-bootstrap.service';

describe('revenueAccountService', () => {
  const service = revenueAccountService(mockLedgerAccountRepo);
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
    type: ELedgerType.Revenue,
    isControlAccount: true,
  } as unknown as IRevenueLedgerAccount;

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
      expect(result[0][0].name).toBe('Services');
      expect(result[1][0].name).toBe('Employment Income');
      expect(result[2][0].name).toBe('Gain on Sale of Assets');
      expect(result[3][0].name).toBe('Unrealized Gain');
    });

    it('should not create accounts if they already exist', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(
        {} as IRevenueLedgerAccount
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

      expect(result.length).toBe(4);
      expect(result[0][0].name).toBe('Services (Default)');
      expect(result[1][0].name).toBe('Employment Income (Default)');
      expect(result[2][0].name).toBe('Gain on Sale of Assets (Default)');
      expect(result[3][0].name).toBe('Unrealized Gains (Default)');

      expect(result[0][0].controlAccountId).toBe(mockControlAccount.id);
      expect(result[1][0].controlAccountId).toBe(mockControlAccount.id);
      expect(result[2][0].controlAccountId).toBe(mockControlAccount.id);
      expect(result[3][0].controlAccountId).toBe(mockControlAccount.id);
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
