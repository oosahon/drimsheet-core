import { IRepoOptions } from '../../../../app/contracts/infra/repo.contract';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../accounting-entity/types/accounting-entity.types';
import { ICurrency } from '../../../currency/types/currency.types';
import { IEquityLedgerAccount } from '../../types/equity-account.types';
import equityAccountService from '../equity-account-bootstrap.service';

describe('equityAccountService', () => {
  const service = equityAccountService(mockLedgerAccountRepo);
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

      expect(result.length).toBe(2);
      expect(result[0][0].name).toBe('Retained Earnings');
      expect(result[1][0].name).toBe('Opening Balance Equity');
    });

    it('should not create accounts if they already exist', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(
        {} as IEquityLedgerAccount
      );

      const result = await service.bootstrapIndividualHeaderAccounts(
        accountingEntity,
        repoOptions
      );

      expect(result.length).toBe(0);
    });
  });

  describe('bootstrapIndividualPostingAccounts', () => {
    it('should return empty array', async () => {
      const result = await service.bootstrapIndividualPostingAccounts(
        accountingEntity,
        repoOptions
      );
      expect(result.length).toBe(0);
    });
  });
});
