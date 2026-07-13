import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import { IAccountingEntity } from '../../../../accounting/types/accounting-entity.types';
import mockLedgerAccountRepo from '../../../shared/repos/__mocks__/ledger-account.repo.impl.mock';
import { ILiabilityLedgerAccount } from '../../types/liability-account.types';
import makeLiabilityAccountService from '../liability-account.service';

describe('liabilityAccountService', () => {
  const service = makeLiabilityAccountService({
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

      expect(accounts.length).toBe(4);
      expect(events.length).toBeGreaterThan(0);
      expect(
        accounts.some(
          (a: ILiabilityLedgerAccount) => a.name === 'Short Term Debt'
        )
      ).toBe(true);
      expect(
        accounts.some((a: ILiabilityLedgerAccount) => a.name === 'Payables')
      ).toBe(true);
    });

    it('should bootstrap posting accounts when shouldBootstrapPostingAccounts is true', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([]);
      mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
        { id: generateUUID() } as unknown as ILiabilityLedgerAccount,
      ]);

      const { accounts, events } = await service.bootstrapHeaderAccounts(
        validAccountingEntity,
        mockOptions,
        true
      );

      expect(accounts.length).toBe(6);
      expect(events.length).toBeGreaterThan(0);
      expect(
        accounts.some(
          (a: ILiabilityLedgerAccount) =>
            a.name === 'Liability Suspense Account'
        )
      ).toBe(true);
      expect(
        accounts.some(
          (a: ILiabilityLedgerAccount) =>
            a.name === 'Statutory Payables (Default)'
        )
      ).toBe(true);
    });

    it('should not create header accounts if they already exist', async () => {
      const mockExistingAccount = {
        id: generateUUID(),
        code: '200000',
        materializedPath: '200000',
      } as unknown as ILiabilityLedgerAccount;
      mockLedgerAccountRepo.findByCode.mockResolvedValue(mockExistingAccount);

      const { accounts, events } = await service.bootstrapHeaderAccounts(
        validAccountingEntity,
        mockOptions,
        false
      );

      expect(accounts.length).toBe(0);
      expect(events.length).toBe(0);
    });

    it('should only create statutory default when length is 1', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([
        {
          id: generateUUID(),
          name: 'Liability Suspense Account',
        } as unknown as ILiabilityLedgerAccount,
      ]);
      mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
        {
          id: generateUUID(),
          name: 'Statutory Payables',
        } as unknown as ILiabilityLedgerAccount,
      ]);

      const { accounts, events } = await service.bootstrapHeaderAccounts(
        validAccountingEntity,
        mockOptions,
        true
      );

      expect(accounts.length).toBe(5);
      expect(events.length).toBeGreaterThan(0);
      expect(
        accounts.some(
          (a: ILiabilityLedgerAccount) =>
            a.name === 'Statutory Payables (Default)'
        )
      ).toBe(true);
    });

    it('should not create statutory default when length is greater than 1', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);
      mockLedgerAccountRepo.findBySubType.mockResolvedValue([
        {
          id: generateUUID(),
          name: 'Liability Suspense Account',
        } as unknown as ILiabilityLedgerAccount,
      ]);
      mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
        {
          id: generateUUID(),
          name: 'Statutory Payables',
        } as unknown as ILiabilityLedgerAccount,
        {
          id: generateUUID(),
          name: 'Statutory Payables (Default)',
        } as unknown as ILiabilityLedgerAccount,
      ]);

      const { accounts, events } = await service.bootstrapHeaderAccounts(
        validAccountingEntity,
        mockOptions,
        true
      );

      // Should just be the 4 headers, no statutory default, no suspense
      expect(accounts.length).toBe(4);
      expect(events.length).toBeGreaterThan(0);
      expect(
        accounts.some(
          (a: ILiabilityLedgerAccount) =>
            a.name === 'Statutory Payables (Default)'
        )
      ).toBe(false);
    });
  });
});
