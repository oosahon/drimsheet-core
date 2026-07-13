import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import { IAccountingEntity } from '../../../../accounting/types/accounting-entity.types';
import mockLedgerAccountRepo from '../../../shared/repos/__mocks__/ledger-account.repo.impl.mock';
import { IExpenseLedgerAccount } from '../../types/expense-account.types';
import makeExpenseAccountService from '../expense-account.service';

describe('expenseAccountService', () => {
  const service = makeExpenseAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });
  const mockOptions: IReadRepoOptions = {
    correlationId: 'test-correlation-id',
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T00:00:00.000Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('bootstrapHeaderAccounts', () => {
    const ownerId = generateUUID();
    const entityId = generateUUID();

    const validAccountingEntity = {
      id: entityId,
      ownerId,
      functionalCurrencyCode: 'USD',
    } as IAccountingEntity;

    it('should create header accounts when none exist and not bootstrap posting accounts', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

      const { accounts, events } = await service.bootstrapHeaderAccounts(
        validAccountingEntity,
        mockOptions,
        false
      );

      expect(accounts.length).toBe(8);
      expect(events.length).toBeGreaterThan(0);
      expect(
        accounts.some((a: IExpenseLedgerAccount) => a.name === 'Direct Costs')
      ).toBe(true);
    });

    it('should bootstrap posting accounts when shouldBootstrapPostingAccounts is true', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

      const { accounts, events } = await service.bootstrapHeaderAccounts(
        validAccountingEntity,
        mockOptions,
        true
      );

      expect(accounts.length).toBe(16);
      expect(events.length).toBeGreaterThan(0);
      expect(
        accounts.some(
          (a: IExpenseLedgerAccount) => a.name === 'Direct Costs (Default)'
        )
      ).toBe(true);
    });

    it('should not create header accounts if they already exist', async () => {
      const mockExistingAccount = {
        id: generateUUID(),
        code: '500000',
        materializedPath: '500000',
      } as unknown as IExpenseLedgerAccount;
      mockLedgerAccountRepo.findByCode.mockResolvedValue(mockExistingAccount);

      const { accounts, events } = await service.bootstrapHeaderAccounts(
        validAccountingEntity,
        mockOptions,
        false
      );

      expect(accounts.length).toBe(0);
      expect(events.length).toBe(0);
    });
  });
});
