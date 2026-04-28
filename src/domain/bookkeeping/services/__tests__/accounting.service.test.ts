import { IRepoOptions } from '../../../../app/contracts/infra/repo.contract';
import mockLedgerAccountBalanceRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account-balance.repo.impl.mock';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import { IMoney } from '../../../../shared/types/money.types';
import { TEntityId } from '../../../../shared/types/uuid';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { IAccountingEntity } from '../../../accounting-entity/types/accounting-entity.types';
import {
  EExchangeRateType,
  IExchangeRate,
} from '../../../currency/types/exchange-rate.types';
import { EJournalEntryStatus } from '../../../journal-entry/types/journal-entry.types';
import {
  EJournalSide,
  IJournalLine,
} from '../../../journal-entry/types/journal-line.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
  ILedgerAccount,
} from '../../../ledger/types/ledger.types';
import makeBookkeepingService from '../bookkeeping.service';

describe('accountingService', () => {
  const service = makeBookkeepingService(
    mockLedgerAccountRepo,
    mockLedgerAccountBalanceRepo
  );
  const mockOptions: IRepoOptions = { correlationId: 'test-correlation-id' };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T00:00:00.000Z'));
    jest.resetAllMocks();
    mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId.mockResolvedValue(
      []
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createOpeningBalanceJournalEntry', () => {
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
      createdBy: generateUUID(),
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
        mockLedgerAccountRepo.findBySubType.mockResolvedValueOnce([
          validEquityAccount,
        ]);

        const [journalEntry, events] =
          await service.createOpeningBalanceJournalEntry(
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
          service.createOpeningBalanceJournalEntry(payload, mockOptions)
        ).rejects.toThrow('Cannot set opening balance on control account');
      });

      it('should throw if opening balance has already been set', async () => {
        mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId.mockResolvedValueOnce(
          [{ id: 'mock-adjustment' } as never]
        );

        await expect(
          service.createOpeningBalanceJournalEntry(validPayload, mockOptions)
        ).rejects.toThrow('Opening balance has already been set');
      });

      it('should throw if equity account is not configured', async () => {
        mockLedgerAccountRepo.findBySubType.mockResolvedValueOnce([]);

        await expect(
          service.createOpeningBalanceJournalEntry(validPayload, mockOptions)
        ).rejects.toThrow('Account type for opening balance is not configured');
      });
    });

    describe('Payload Validations (Domain bubbling)', () => {
      beforeEach(() => {
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
          service.createOpeningBalanceJournalEntry(payload, mockOptions)
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
          service.createOpeningBalanceJournalEntry(payload, mockOptions)
        ).rejects.toThrow('Invalid UUID');
      });

      it('should throw if amount is invalid', async () => {
        const payload = {
          ...validPayload,
          amount: { ...validAmount, amount: 'invalid' as unknown as bigint },
        };

        await expect(
          service.createOpeningBalanceJournalEntry(payload, mockOptions)
        ).rejects.toThrow('Invalid amount');
      });

      it('should throw if exchange rate is not supported for same currency', async () => {
        const payload = {
          ...validPayload,
          exchangeRate: {} as IExchangeRate,
        };

        await expect(
          service.createOpeningBalanceJournalEntry(payload, mockOptions)
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
          service.createOpeningBalanceJournalEntry(payload, mockOptions)
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
          service.createOpeningBalanceJournalEntry(payload, mockOptions)
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
          service.createOpeningBalanceJournalEntry(payload, mockOptions)
        ).rejects.toThrow(
          "Exchange rate target doesn't match functional currency."
        );
      });
    });
  });

  describe('getBalanceEffectDelta', () => {
    const accountId = generateUUID();
    const entityId = generateUUID();
    const currency = {
      code: 'USD',
      name: 'US Dollar',
      minorUnit: 2n,
      symbol: '$',
    };
    const functionalCurrency = {
      code: 'EUR',
      name: 'Euro',
      minorUnit: 2n,
      symbol: '€',
    };

    const account: ILedgerAccount = {
      id: accountId,
      code: '100000',
      materializedPath: '100000',
      accountingEntityId: entityId,
      type: ELedgerType.Asset,
      normalBalance: ENormalBalance.Debit,
      subType: 'test',
      behavior: 'test',
      isControlAccount: false,
      controlAccountId: null,
      name: 'Test Account',
      currency: currency,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      meta: null,
      createdBy: generateUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const baseLine: IJournalLine = {
      id: generateUUID(),
      entryId: generateUUID(),
      accountId: accountId,
      sequenceOrder: 1,
      amount: { amount: 1000n, currency },
      exchangeRate: {
        currencyPair: 'USD/EUR',
        baseCurrencyCode: 'USD',
        targetCurrencyCode: 'EUR',
        rate: 0.85,
        type: EExchangeRateType.Official,
        asOf: new Date(),
        source: 'test',
        createdAt: new Date(),
      },
      functionalAmount: { amount: 850n, currency: functionalCurrency },
      side: EJournalSide.Debit,
      description: null,
      meta: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should throw if account is not found', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(null);
      await expect(
        service.getBalanceEffectDelta(accountId, [baseLine], mockOptions)
      ).rejects.toThrow('Account not found');
    });

    it('should throw if any line has a different accountId', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(account);
      const invalidLine = { ...baseLine, accountId: generateUUID() };
      await expect(
        service.getBalanceEffectDelta(
          accountId,
          [baseLine, invalidLine],
          mockOptions
        )
      ).rejects.toThrow(
        'All lines must be associated with the same account, functional currency and currency'
      );
    });

    it('should throw if any line has a different functional currency', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(account);
      const invalidLine = {
        ...baseLine,
        functionalAmount: {
          ...baseLine.functionalAmount,
          currency: {
            code: 'GBP',
            name: 'British Pound',
            minorUnit: 2n,
            symbol: '£',
          },
        },
      };
      await expect(
        service.getBalanceEffectDelta(
          accountId,
          [baseLine, invalidLine],
          mockOptions
        )
      ).rejects.toThrow(
        'All lines must be associated with the same account, functional currency and currency'
      );
    });

    it('should throw if any line has a different amount currency than the account', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(account);
      const invalidLine = {
        ...baseLine,
        amount: {
          ...baseLine.amount,
          currency: {
            code: 'GBP',
            name: 'British Pound',
            minorUnit: 2n,
            symbol: '£',
          },
        },
      };
      await expect(
        service.getBalanceEffectDelta(
          accountId,
          [baseLine, invalidLine],
          mockOptions
        )
      ).rejects.toThrow(
        'All lines must be associated with the same account, functional currency and currency'
      );
    });

    it('should correctly calculate balance delta for same normal balance side (increase)', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(account);
      const line2 = {
        ...baseLine,
        amount: { amount: 500n, currency },
        functionalAmount: { amount: 425n, currency: functionalCurrency },
      };

      const result = await service.getBalanceEffectDelta(
        accountId,
        [baseLine, line2],
        mockOptions
      );

      expect(result.balanceDelta.amount).toBe(1500n);
      expect(result.functionalBalanceDelta.amount).toBe(1275n);
    });

    it('should correctly calculate balance delta for opposite normal balance side (decrease)', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(account);
      const line2 = {
        ...baseLine,
        side: EJournalSide.Credit,
        amount: { amount: 500n, currency },
        functionalAmount: { amount: 425n, currency: functionalCurrency },
      };

      const result = await service.getBalanceEffectDelta(
        accountId,
        [baseLine, line2],
        mockOptions
      );

      expect(result.balanceDelta.amount).toBe(500n);
      expect(result.functionalBalanceDelta.amount).toBe(425n);
    });

    it('should correctly calculate balance delta crossing zero (decrease)', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(account);
      const line2 = {
        ...baseLine,
        side: EJournalSide.Credit,
        amount: { amount: 1500n, currency },
        functionalAmount: { amount: 1275n, currency: functionalCurrency },
      };

      const result = await service.getBalanceEffectDelta(
        accountId,
        [baseLine, line2],
        mockOptions
      );

      expect(result.balanceDelta.amount).toBe(-500n);
      expect(result.functionalBalanceDelta.amount).toBe(-425n);
    });
  });
});
