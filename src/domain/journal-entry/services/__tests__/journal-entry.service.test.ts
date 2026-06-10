import mockLedgerAccountBalanceRepo from '../../../../infra/persistence/repos/ledger/__mocks__/ledger-account-balance.repo.impl.mock';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/ledger/__mocks__/ledger-account.repo.impl.mock';
import { IMoney } from '../../../../shared/types/money.types';
import { IRepoOptions } from '../../../../shared/types/repo.types';
import { TEntityId } from '../../../../shared/types/uuid';
import generateUUID from '../../../../shared/utils/uuid-generator';
import moneyValue from '../../../../shared/value-objects/money.vo';
import { IAccountingEntity } from '../../../accounting/types/accounting-entity.types';
import { SYSTEM_CURRENCIES } from '../../../currency/config/currencies.config';
import {
  EExchangeRateType,
  IExchangeRate,
} from '../../../currency/types/exchange-rate.types';
import cashAndEquivalentAccountEntity from '../../../ledger/entities/01-asset-account/00-cash-and-equivalents.entity';
import receivablesAccountEntity from '../../../ledger/entities/01-asset-account/02-receivables.entity';
import { EAssetAccountBehavior } from '../../../ledger/types/asset-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
  ILedgerAccount,
} from '../../../ledger/types/ledger.types';
import { IJournalTransactionPayload } from '../../types/journal-entry.service.types';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../types/journal-entry.types';
import { EJournalSide, IJournalLine } from '../../types/journal-line.types';
import journalEntryServiceHelpers from '../helpers/journal-entry.service.helpers';
import makeJournalEntryService from '../journal-entry.service';

describe('journalEntryService', () => {
  const service = makeJournalEntryService(
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

  describe('helpers', () => {
    const entityId = generateUUID();
    const createdBy = generateUUID();

    const [sourceCashAccount] = cashAndEquivalentAccountEntity.make(
      {
        name: 'Source Cash',
        accountingEntityId: entityId,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        controlAccountId: null,
        behavior: EAssetAccountBehavior.DefaultCash,
        meta: null,
        createdBy,
      },
      { precedingCode: '100000', parentMaterializedPath: '100000' }
    );

    const [destinationCashAccount] = cashAndEquivalentAccountEntity.make(
      {
        name: 'Destination Cash',
        accountingEntityId: entityId,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        controlAccountId: null,
        behavior: EAssetAccountBehavior.DefaultCash,
        meta: null,
        createdBy,
      },
      { precedingCode: '100100', parentMaterializedPath: '100000' }
    );

    const [receivableAccount] =
      receivablesAccountEntity.makeTradeReceivableAccount(
        {
          name: 'Trade Receivable',
          accountingEntityId: entityId,
          currency: SYSTEM_CURRENCIES.NGN,
          isControlAccount: false,
          controlAccountId: generateUUID(),
          createdBy,
        },
        { precedingCode: '102000', parentMaterializedPath: '102000' }
      );

    describe('validateTransfer', () => {
      it('should allow transfers between cash and cash equivalent accounts', () => {
        expect(() =>
          journalEntryServiceHelpers.validateTransfer(sourceCashAccount, [
            destinationCashAccount,
          ])
        ).not.toThrow();
      });

      it('should throw if the source account subtype is not permitted for transfers', () => {
        expect(() =>
          journalEntryServiceHelpers.validateTransfer(receivableAccount, [
            destinationCashAccount,
          ])
        ).toThrow();
      });

      it('should throw if a destination account subtype differs from the source', () => {
        expect(() =>
          journalEntryServiceHelpers.validateTransfer(sourceCashAccount, [
            receivableAccount,
          ])
        ).toThrow();
      });
    });

    describe('validateTransactionAccounts', () => {
      it('should validate transfer transaction accounts', () => {
        expect(() =>
          journalEntryServiceHelpers.validateTransactionAccounts(
            sourceCashAccount,
            [destinationCashAccount],
            EJournalEntrySourceType.Transfer
          )
        ).not.toThrow();
      });

      it('should throw if the source type is unsupported', () => {
        expect(() =>
          journalEntryServiceHelpers.validateTransactionAccounts(
            sourceCashAccount,
            [destinationCashAccount],
            EJournalEntrySourceType.Purchase
          )
        ).toThrow();
      });
    });
  });

  describe('recordOpeningBalance', () => {
    const entityId = generateUUID();
    const accountId = generateUUID();
    const equityAccountId = generateUUID();

    const validAccountingEntity = {
      id: entityId,
      functionalCurrencyCode: 'NGN',
    } as IAccountingEntity;

    const validAccount = {
      id: accountId,
      accountingEntityId: entityId,
      isControlAccount: false,
      normalBalance: ENormalBalance.Debit,
      createdBy: generateUUID(),
    } as ILedgerAccount;

    const validEquityAccount = {
      id: equityAccountId,
    } as ILedgerAccount;

    const validAmount: IMoney = {
      amount: 1000n,
      currency: SYSTEM_CURRENCIES.NGN,
    };

    const validPayload = {
      accountingEntity: validAccountingEntity,
      account: validAccount,
      exchangeRate: null,
      amount: validAmount,
    };

    describe('when valid payload is provided', () => {
      it('should return a journal entry successfully for an account with Debit normal balance', async () => {
        mockLedgerAccountRepo.findBySubType.mockResolvedValueOnce([
          validEquityAccount,
        ]);

        const [journalEntry, events] = await service.recordOpeningBalance(
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

      it('should return a journal entry successfully for an account with Credit normal balance', async () => {
        mockLedgerAccountRepo.findBySubType.mockResolvedValueOnce([
          validEquityAccount,
        ]);

        const payload = {
          ...validPayload,
          account: {
            ...validAccount,
            normalBalance: ENormalBalance.Credit,
          },
        };

        const [journalEntry, events] = await service.recordOpeningBalance(
          payload,
          mockOptions
        );

        expect(journalEntry.accountingEntityId).toBe(entityId);
        expect(journalEntry.status).toBe(EJournalEntryStatus.Posted);
        expect(journalEntry.lines).toHaveLength(2);
        expect(journalEntry.lines[0].accountId).toBe(accountId);
        expect(journalEntry.lines[0].side).toBe(EJournalSide.Credit);
        expect(journalEntry.lines[1].accountId).toBe(equityAccountId);
        expect(journalEntry.lines[1].side).toBe(EJournalSide.Debit);
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
          service.recordOpeningBalance(payload, mockOptions)
        ).rejects.toThrow();
      });

      it('should throw if opening balance has already been set', async () => {
        mockLedgerAccountBalanceRepo.findAdjustmentsByAccountId.mockResolvedValueOnce(
          [{ id: 'mock-adjustment' } as never]
        );

        await expect(
          service.recordOpeningBalance(validPayload, mockOptions)
        ).rejects.toThrow();
      });

      it('should throw if equity account is not configured', async () => {
        mockLedgerAccountRepo.findBySubType.mockResolvedValueOnce([]);

        await expect(
          service.recordOpeningBalance(validPayload, mockOptions)
        ).rejects.toThrow();
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
          service.recordOpeningBalance(payload, mockOptions)
        ).rejects.toThrow();
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
          service.recordOpeningBalance(payload, mockOptions)
        ).rejects.toThrow();
      });

      it('should throw if amount is invalid', async () => {
        const payload = {
          ...validPayload,
          amount: { ...validAmount, amount: 'invalid' as unknown as bigint },
        };

        await expect(
          service.recordOpeningBalance(payload, mockOptions)
        ).rejects.toThrow();
      });

      it('should throw if exchange rate is not supported for same currency', async () => {
        const payload = {
          ...validPayload,
          exchangeRate: {} as IExchangeRate,
        };

        await expect(
          service.recordOpeningBalance(payload, mockOptions)
        ).rejects.toThrow();
      });

      it('should throw if exchange rate is required for different currencies', async () => {
        const payload = {
          ...validPayload,
          amount: {
            ...validAmount,
            currency: SYSTEM_CURRENCIES.EUR,
          },
          exchangeRate: null,
        };

        await expect(
          service.recordOpeningBalance(payload, mockOptions)
        ).rejects.toThrow();
      });

      it('should throw if exchange rate base does not match amount currency', async () => {
        const payload = {
          ...validPayload,
          amount: {
            ...validAmount,
            currency: SYSTEM_CURRENCIES.EUR,
          },
          exchangeRate: {
            baseCurrencyCode: 'GBP',
            targetCurrencyCode: 'USD',
          } as IExchangeRate,
        };

        await expect(
          service.recordOpeningBalance(payload, mockOptions)
        ).rejects.toThrow();
      });

      it('should throw if exchange rate target does not match functional currency', async () => {
        const payload = {
          ...validPayload,
          amount: {
            ...validAmount,
            currency: SYSTEM_CURRENCIES.EUR,
          },
          exchangeRate: {
            baseCurrencyCode: 'EUR',
            targetCurrencyCode: 'GBP',
          } as IExchangeRate,
        };

        await expect(
          service.recordOpeningBalance(payload, mockOptions)
        ).rejects.toThrow();
      });
    });
  });

  describe('recordTransaction', () => {
    const entityId = generateUUID();
    const createdBy = generateUUID();
    const functionalCurrency = SYSTEM_CURRENCIES.NGN;
    const transferAmount = moneyValue.make(1000n, SYSTEM_CURRENCIES.NGN, true);

    const [sourceAccount] = cashAndEquivalentAccountEntity.make(
      {
        name: 'Source Cash',
        accountingEntityId: entityId,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        controlAccountId: null,
        behavior: EAssetAccountBehavior.DefaultCash,
        meta: null,
        createdBy,
      },
      { precedingCode: '100000', parentMaterializedPath: '100000' }
    );

    const [destinationAccount] = cashAndEquivalentAccountEntity.make(
      {
        name: 'Destination Cash',
        accountingEntityId: entityId,
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        controlAccountId: null,
        behavior: EAssetAccountBehavior.DefaultCash,
        meta: null,
        createdBy,
      },
      { precedingCode: '100100', parentMaterializedPath: '100000' }
    );

    const [controlAccount] = cashAndEquivalentAccountEntity.makeHeader({
      name: 'Cash Header',
      accountingEntityId: entityId,
      currency: SYSTEM_CURRENCIES.NGN,
      createdBy,
    });

    const [receivableAccount] =
      receivablesAccountEntity.makeTradeReceivableAccount(
        {
          name: 'Trade Receivable',
          accountingEntityId: entityId,
          currency: SYSTEM_CURRENCIES.NGN,
          isControlAccount: false,
          controlAccountId: generateUUID(),
          createdBy,
        },
        { precedingCode: '102000', parentMaterializedPath: '102000' }
      );

    const makeTransferPayload = (
      overrides: Partial<IJournalTransactionPayload> = {}
    ): IJournalTransactionPayload => ({
      sourceLine: {
        accountId: sourceAccount.id,
        amount: transferAmount,
        exchangeRate: null,
        functionalCurrency,
        description: 'Transfer from source',
        side: EJournalSide.Credit,
        sequenceOrder: 1,
      },
      destinationLines: [
        {
          accountId: destinationAccount.id,
          amount: transferAmount,
          exchangeRate: null,
          functionalCurrency,
          description: 'Transfer to destination',
          side: EJournalSide.Debit,
          sequenceOrder: 2,
        },
      ],
      header: {
        accountingEntityId: entityId,
        sourceType: EJournalEntrySourceType.Transfer,
        counterPartyId: null,
        status: EJournalEntryStatus.Posted,
        effectiveDate: new Date('2026-03-15T00:00:00.000Z'),
        postedAt: new Date('2026-03-15T00:00:00.000Z'),
        voidedAt: null,
        voidingEntryId: null,
        memo: 'Cash transfer',
        createdBy,
        functionalCurrency,
      },
      ...overrides,
    });

    it('should record a transfer transaction successfully', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(sourceAccount);
      mockLedgerAccountRepo.findAllByIds.mockResolvedValueOnce([
        destinationAccount,
      ]);

      const [journalEntry, events] = await service.recordTransaction(
        makeTransferPayload(),
        mockOptions
      );

      expect(mockLedgerAccountRepo.findById).toHaveBeenCalledWith(
        sourceAccount.id,
        mockOptions
      );
      expect(mockLedgerAccountRepo.findAllByIds).toHaveBeenCalledWith(
        [destinationAccount.id],
        mockOptions
      );
      expect(journalEntry.sourceType).toBe(EJournalEntrySourceType.Transfer);
      expect(journalEntry.lines).toHaveLength(2);
      expect(journalEntry.lines[0].accountId).toBe(sourceAccount.id);
      expect(journalEntry.lines[1].accountId).toBe(destinationAccount.id);
      expect(events.length).toBeGreaterThan(0);
    });

    it('should throw if a destination line has the same side as the source line', async () => {
      const payload = makeTransferPayload({
        destinationLines: [
          {
            accountId: destinationAccount.id,
            amount: transferAmount,
            exchangeRate: null,
            functionalCurrency,
            description: 'Invalid destination',
            side: EJournalSide.Credit,
            sequenceOrder: 2,
          },
        ],
      });

      await expect(
        service.recordTransaction(payload, mockOptions)
      ).rejects.toThrow();

      expect(mockLedgerAccountRepo.findById).not.toHaveBeenCalled();
    });

    it('should throw if the source account is not found', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(null);

      await expect(
        service.recordTransaction(makeTransferPayload(), mockOptions)
      ).rejects.toThrow();
    });

    it('should throw if the source account is a control account', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(controlAccount);

      await expect(
        service.recordTransaction(makeTransferPayload(), mockOptions)
      ).rejects.toThrow();
    });

    it('should throw if any destination account is not found', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(sourceAccount);
      mockLedgerAccountRepo.findAllByIds.mockResolvedValueOnce([]);

      await expect(
        service.recordTransaction(makeTransferPayload(), mockOptions)
      ).rejects.toThrow();
    });

    it('should throw if the source type is unsupported', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(sourceAccount);
      mockLedgerAccountRepo.findAllByIds.mockResolvedValueOnce([
        destinationAccount,
      ]);

      await expect(
        service.recordTransaction(
          makeTransferPayload({
            header: {
              ...makeTransferPayload().header,
              sourceType: EJournalEntrySourceType.Purchase,
            },
          }),
          mockOptions
        )
      ).rejects.toThrow();
    });

    it('should throw if a transfer source account subtype is not permitted', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(receivableAccount);
      mockLedgerAccountRepo.findAllByIds.mockResolvedValueOnce([
        destinationAccount,
      ]);

      await expect(
        service.recordTransaction(
          makeTransferPayload({
            sourceLine: {
              ...makeTransferPayload().sourceLine,
              accountId: receivableAccount.id,
            },
          }),
          mockOptions
        )
      ).rejects.toThrow();
    });

    it('should throw if a transfer destination account subtype differs from the source', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(sourceAccount);
      mockLedgerAccountRepo.findAllByIds.mockResolvedValueOnce([
        receivableAccount,
      ]);

      await expect(
        service.recordTransaction(
          makeTransferPayload({
            destinationLines: [
              {
                ...makeTransferPayload().destinationLines[0],
                accountId: receivableAccount.id,
              },
            ],
          }),
          mockOptions
        )
      ).rejects.toThrow();
    });
  });

  describe('getBalanceEffectDelta', () => {
    const accountId = generateUUID();
    const entityId = generateUUID();
    const currency = SYSTEM_CURRENCIES.USD;
    const functionalCurrency = SYSTEM_CURRENCIES.EUR;

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
      ).rejects.toThrow();
    });

    it('should throw if journal lines array is empty', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(account);
      await expect(
        service.getBalanceEffectDelta(accountId, [], mockOptions)
      ).rejects.toThrow();
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
      ).rejects.toThrow();
    });

    it('should throw if any line has a different functional currency', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(account);
      const invalidLine = {
        ...baseLine,
        functionalAmount: {
          ...baseLine.functionalAmount,
          currency: SYSTEM_CURRENCIES.GBP,
        },
      };
      await expect(
        service.getBalanceEffectDelta(
          accountId,
          [baseLine, invalidLine],
          mockOptions
        )
      ).rejects.toThrow();
    });

    it('should throw if any line has a different amount currency than the account', async () => {
      mockLedgerAccountRepo.findById.mockResolvedValueOnce(account);
      const invalidLine = {
        ...baseLine,
        amount: {
          ...baseLine.amount,
          currency: SYSTEM_CURRENCIES.GBP,
        },
      };
      await expect(
        service.getBalanceEffectDelta(
          accountId,
          [baseLine, invalidLine],
          mockOptions
        )
      ).rejects.toThrow();
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
