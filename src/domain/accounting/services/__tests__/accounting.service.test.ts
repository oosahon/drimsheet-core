import { IRepoOptions } from '../../../../app/contracts/infra/repo.contract';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import { IMoney } from '../../../../shared/types/money.types';
import { TEntityId } from '../../../../shared/types/uuid';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { IAccountingEntity } from '../../../accounting-entity/types/accounting-entity.types';
import { IExchangeRate } from '../../../currency/types/exchange-rate.types';
import { EJournalEntryStatus } from '../../../journal-entry/types/journal-entry.types';
import { EJournalSide } from '../../../journal-entry/types/journal-line.types';
import { ILedgerAccount } from '../../../ledger/types/ledger.types';
import makeAccountingService from '../accounting.service';

describe('accountingService', () => {
  const service = makeAccountingService(mockLedgerAccountRepo);
  const mockOptions: IRepoOptions = { correlationId: 'test-correlation-id' };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T00:00:00.000Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('recordOpeningBalanceTransaction', () => {
    const entityId = generateUUID();
    const accountId = generateUUID();
    const equityAccountId = generateUUID();

    const validAccountingEntity = {
      id: entityId,
      functionalCurrency: {
        code: 'USD',
        name: 'US Dollar',
        minorUnit: 2n,
        symbol: '$',
      },
    } as IAccountingEntity;

    const validAccount = {
      id: accountId,
      accountingEntityId: entityId,
      isControlAccount: false,
    } as ILedgerAccount;

    const validEquityAccount = {
      id: equityAccountId,
    } as ILedgerAccount;

    const validAmount: IMoney = {
      amount: 1000n,
      currency: { code: 'USD', name: 'US Dollar', minorUnit: 2n, symbol: '$' },
    };

    const validPayload = {
      accountingEntity: validAccountingEntity,
      account: validAccount,
      exchangeRate: null,
      amount: validAmount,
    };

    describe('when valid payload is provided', () => {
      it('should return a journal entry successfully', async () => {
        mockLedgerAccountRepo.findById.mockResolvedValueOnce(null);
        mockLedgerAccountRepo.findBySubType.mockResolvedValueOnce([
          validEquityAccount,
        ]);

        const [journalEntry, events] =
          await service.recordOpeningBalanceTransaction(
            validPayload,
            mockOptions
          );

        expect(journalEntry.accountingEntityId).toBe(entityId);
        expect(journalEntry.status).toBe(EJournalEntryStatus.Posted);
        expect(journalEntry.lines).toHaveLength(2);
        expect(journalEntry.lines[0].accountId).toBe(accountId);
        expect(journalEntry.lines[0].side).toBe(EJournalSide.Debit);
        expect(journalEntry.lines[1].accountId).toBe(equityAccountId);
        expect(journalEntry.lines[1].side).toBe(EJournalSide.Credit);
        expect(events.length).toBeGreaterThan(0);
      });
    });

    describe('Service Logic Validations', () => {
      it('should throw if account is a control account', async () => {
        const payload = {
          ...validPayload,
          account: { ...validAccount, isControlAccount: true },
        };

        await expect(
          service.recordOpeningBalanceTransaction(payload, mockOptions)
        ).rejects.toThrow('Cannot set opening balance on control account');
      });

      it('should throw if opening balance has already been set', async () => {
        mockLedgerAccountRepo.findById.mockResolvedValueOnce(validAccount);

        await expect(
          service.recordOpeningBalanceTransaction(validPayload, mockOptions)
        ).rejects.toThrow('Opening balance has already been set');
      });

      it('should throw if equity account is not configured', async () => {
        mockLedgerAccountRepo.findById.mockResolvedValueOnce(null);
        mockLedgerAccountRepo.findBySubType.mockResolvedValueOnce([]);

        await expect(
          service.recordOpeningBalanceTransaction(validPayload, mockOptions)
        ).rejects.toThrow('Account type for opening balance is not configured');
      });
    });

    describe('Payload Validations (Domain bubbling)', () => {
      beforeEach(() => {
        mockLedgerAccountRepo.findById.mockResolvedValue(null);
        mockLedgerAccountRepo.findBySubType.mockResolvedValue([
          validEquityAccount,
        ]);
      });

      it('should throw if account.id is an invalid UUID', async () => {
        const payload = {
          ...validPayload,
          account: { ...validAccount, id: 'invalid-uuid' as TEntityId },
        };

        await expect(
          service.recordOpeningBalanceTransaction(payload, mockOptions)
        ).rejects.toThrow('Invalid UUID');
      });

      it('should throw if accountingEntityId is an invalid UUID', async () => {
        const payload = {
          ...validPayload,
          account: {
            ...validAccount,
            accountingEntityId: 'invalid-uuid' as TEntityId,
          },
        };

        await expect(
          service.recordOpeningBalanceTransaction(payload, mockOptions)
        ).rejects.toThrow('Invalid UUID');
      });

      it('should throw if amount is invalid', async () => {
        const payload = {
          ...validPayload,
          amount: { ...validAmount, amount: 'invalid' as unknown as bigint },
        };

        await expect(
          service.recordOpeningBalanceTransaction(payload, mockOptions)
        ).rejects.toThrow('Invalid amount');
      });

      it('should throw if exchange rate is not supported for same currency', async () => {
        const payload = {
          ...validPayload,
          exchangeRate: {} as IExchangeRate,
        };

        await expect(
          service.recordOpeningBalanceTransaction(payload, mockOptions)
        ).rejects.toThrow('Exchange rate is not supported for same currency.');
      });

      it('should throw if exchange rate is required for different currencies', async () => {
        const payload = {
          ...validPayload,
          amount: {
            ...validAmount,
            currency: { code: 'EUR', name: 'Euro', minorUnit: 2n, symbol: '€' },
          },
          exchangeRate: null,
        };

        await expect(
          service.recordOpeningBalanceTransaction(payload, mockOptions)
        ).rejects.toThrow(
          'Exchange rate is required for different currencies.'
        );
      });

      it('should throw if exchange rate base does not match amount currency', async () => {
        const payload = {
          ...validPayload,
          amount: {
            ...validAmount,
            currency: { code: 'EUR', name: 'Euro', minorUnit: 2n, symbol: '€' },
          },
          exchangeRate: {
            baseCurrencyCode: 'GBP',
            targetCurrencyCode: 'USD',
          } as IExchangeRate,
        };

        await expect(
          service.recordOpeningBalanceTransaction(payload, mockOptions)
        ).rejects.toThrow("Exchange rate base doesn't match amount currency.");
      });

      it('should throw if exchange rate target does not match functional currency', async () => {
        const payload = {
          ...validPayload,
          amount: {
            ...validAmount,
            currency: { code: 'EUR', name: 'Euro', minorUnit: 2n, symbol: '€' },
          },
          exchangeRate: {
            baseCurrencyCode: 'EUR',
            targetCurrencyCode: 'GBP',
          } as IExchangeRate,
        };

        await expect(
          service.recordOpeningBalanceTransaction(payload, mockOptions)
        ).rejects.toThrow(
          "Exchange rate target doesn't match functional currency."
        );
      });
    });
  });
});
