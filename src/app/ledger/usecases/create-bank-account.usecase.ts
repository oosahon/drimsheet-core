import IEventBus from '@shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '@shared/contracts/repo.contract';
import zodValidationRunner from '@shared/utils/zod-validation-runner';
import eventValue from '@shared/values/events/event.vo';
import { IEvent } from '@shared/values/events/types/event.types';
import historyValue from '@shared/values/history/history.vo';

import IAccountingPeriodService from '@domain/accounting/types/accounting-period.service.types';
import { IJournalEntryService } from '@domain/journal-entry/types/journal-entry.service.types';
import { EJournalEntryStatus } from '@domain/journal-entry/types/journal-entry.types';
import { ASSET_LEDGER_CODES } from '@domain/ledger/config/asset-codes.config';
import ledgerAccountEntity from '@domain/ledger/entities/ledger-account.entity';
import ledgerAccountError from '@domain/ledger/errors/ledger-account.error';
import IBankAccountRepo from '@domain/ledger/repos/bank-account.repo';
import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import ICashAccountService from '@domain/ledger/types/cash-account.service.types';
import { TCashLedgerCode } from '@domain/ledger/types/ledger-code.types';
import bankDetailsValue from '@domain/ledger/values/bank-details.vo';
import currencyEntity from '@domain/money/entities/currency.entity';

import IAppContext from '@app/context/contracts/app-context.contract';
import IJournalEntryPersistenceService from '@app/journal-entry/contracts/journal-entry-persistence.service.contract';
import ILedgerAccountPersistenceService from '@app/ledger/contracts/ledger-account-persistence.service.contract';
import ILedgerBalanceAdjustmentQueue from '@app/ledger/contracts/ledger-balance-adjustment-queue.contract';
import { IBankAccountCreationReq } from '@app/ledger/dtos/asset-account/asset-account.dto';
import { bankAccountCreationReqValidation } from '@app/ledger/dtos/asset-account/asset-account.dto.validation';
import { ILedgerAccountDto } from '@app/ledger/dtos/ledger-account/ledger-account.dto';
import finalizeWithoutOpeningBalance from '@app/ledger/usecases/helpers/finalize-without-opening-balance.helper';
import getControlAccountHelper from '@app/ledger/usecases/helpers/get-control-account.helper';
import getOpeningBalanceExchangeRate from '@app/ledger/usecases/helpers/get-opening-balance-exchange-rate.helper';
import mapLedgerAccountToDto from '@app/ledger/usecases/helpers/map-ledger-account-to-dto.helper';
import validateOpeningBalanceExchangeRate from '@app/ledger/usecases/helpers/validate-opening-balance-exchange-rate.helper';
import moneyMapper from '@app/money/dtos/money/money.dto.mapper';
import IOutboxService from '@app/outbox/contracts/outbox.service.contract';
import IFxCostBasisPersistenceService from '@app/subledger/fx-cost-basis/contracts/fx-cost-basis-persistence.service.contract';
import IFxLotAppService from '@app/subledger/fx-cost-basis/contracts/fx-lot.service.contract';

interface IDependencies {
  appContext: IAppContext;
  eventBus: IEventBus;
  accountingPeriodService: IAccountingPeriodService;
  cashAccountService: ICashAccountService;
  bankAccountRepo: IBankAccountRepo;
  ledgerAccountRepo: ILedgerAccountRepo;
  journalEntryService: IJournalEntryService;
  journalEntryPersistenceService: IJournalEntryPersistenceService;
  outboxService: IOutboxService;
  ledgerBalanceAdjustmentQueue: ILedgerBalanceAdjustmentQueue;
  repoService: IRepoService;
  ledgerAccountPersistenceService: ILedgerAccountPersistenceService;
  fxLotAppService: IFxLotAppService;
  fxCostBasisPersistenceService: IFxCostBasisPersistenceService;
}

export default function makeCreateBankAccountUseCase(deps: IDependencies) {
  return async (
    payload: IBankAccountCreationReq
  ): Promise<ILedgerAccountDto> => {
    const { correlationId, user, accountingEntity } = deps.appContext.get([
      'user',
      'accountingEntity',
    ]);
    const actor = historyValue.getUserActor(user.id);
    const repoOptions = { correlationId };

    // Validate data
    zodValidationRunner(bankAccountCreationReqValidation, payload);

    validateOpeningBalanceExchangeRate(
      accountingEntity.functionalCurrencyCode,
      payload.currencyCode,
      payload.openingBalance
    );

    if (payload.openingBalance?.date) {
      await deps.accountingPeriodService.validatePostingPeriod(
        accountingEntity.id,
        payload.openingBalance.date,
        repoOptions
      );
    }

    const existingBankAccount = await deps.bankAccountRepo.findOne(
      payload.bankAccount.bankName,
      payload.bankAccount.accountNumber,
      repoOptions
    );
    if (existingBankAccount) {
      throw new ledgerAccountError.DuplicateBankAccount({
        details: payload.bankAccount,
      });
    }

    const bankDetails = bankDetailsValue.make({
      countryCode: accountingEntity.jurisdictionCode,
      bankName: payload.bankAccount.bankName,
      accountName: payload.bankAccount.accountName,
      accountNumber: payload.bankAccount.accountNumber,
    });

    const controlAccount = await getControlAccountHelper<TCashLedgerCode>({
      ledgerAccountRepo: deps.ledgerAccountRepo,
      controlAccountId: payload.controlAccountId,
      defaultControlAccountCode: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
      accountingEntityId: accountingEntity.id,
      repoOptions,
    });

    const creationPayload = {
      name: payload.name,
      currency: currencyEntity.getByCode(payload.currencyCode),
      isControlAccount: false,
      userId: user.id,
      accountingEntity,
      controlAccountCode: controlAccount.code,
      bankDetails,
    };

    const auditedAccount = await deps.cashAccountService.createBankSubAccount(
      creationPayload,
      repoOptions
    );

    if (!payload.openingBalance) {
      return await finalizeWithoutOpeningBalance(deps, {
        auditedAccount,
        accountingEntity,
        actor,
        repoOptions,
        persistRelatedRecords: async (account, writeRepoOptions) => {
          await deps.bankAccountRepo.create(
            account.id,
            accountingEntity.id,
            bankDetails,
            writeRepoOptions
          );
        },
      });
    }

    const exchangeRate = getOpeningBalanceExchangeRate(payload.openingBalance);

    const [journalEntry, journalEvents, journalAudit] =
      await deps.journalEntryService.createOpeningBalance(
        {
          accountingEntityId: accountingEntity.id,
          functionalCurrencyCode: accountingEntity.functionalCurrencyCode,
          account: auditedAccount[0],
          amount: moneyMapper.fromDto(payload.openingBalance.amount),
          effectiveDate: payload.openingBalance.date,
          exchangeRate,
          createdBy: user.id,
        },
        repoOptions
      );
    const shouldUpdateBalance =
      journalEntry.status === EJournalEntryStatus.Posted;

    const [updatedAccount, updatedAccountEvents, updatedAccountAudit] =
      ledgerAccountEntity.updateOpeningBalanceDate(
        auditedAccount[0],
        payload.openingBalance.date
      );

    // Make histories
    const initialAccountHistory = historyValue.make(
      auditedAccount[2],
      actor,
      correlationId
    );
    const updatedAccountHistory = historyValue.make(
      updatedAccountAudit,
      actor,
      correlationId
    );
    const accountHistory = [initialAccountHistory, updatedAccountHistory];
    const journalHeaderHistory = historyValue.make(
      journalAudit.header,
      actor,
      correlationId
    );
    const journalLineHistories = journalAudit.lines.map((lineAudit) =>
      historyValue.make(lineAudit, actor, correlationId)
    );

    const fxResult = await deps.fxLotAppService.acquire(
      { journalEntry, account: updatedAccount, actor },
      repoOptions
    );

    // Persist entities
    const dbTransactionFn: TRepoTransactionFn = async (tx) => {
      const writeRepoOptions = { ...repoOptions, tx };

      await deps.ledgerAccountPersistenceService.create(
        updatedAccount,
        accountingEntity.functionalCurrencyCode,
        { ...writeRepoOptions, history: accountHistory }
      );

      await deps.bankAccountRepo.create(
        updatedAccount.id,
        accountingEntity.id,
        bankDetails,
        writeRepoOptions
      );

      await deps.journalEntryPersistenceService.create(
        journalEntry,
        journalHeaderHistory,
        journalLineHistories,
        writeRepoOptions
      );

      if (fxResult) {
        await deps.fxCostBasisPersistenceService.persistAcquisition(
          fxResult.records,
          writeRepoOptions
        );
      }

      if (shouldUpdateBalance) {
        await deps.outboxService.createBalancePropagation(
          journalEntry.id,
          writeRepoOptions
        );
      }
    };

    await deps.repoService.runInTransaction(dbTransactionFn);

    if (shouldUpdateBalance) {
      await deps.ledgerBalanceAdjustmentQueue.add({
        journalEntryId: journalEntry.id,
        correlationId,
      });
    }

    // Assemble events
    const allEvents: IEvent<unknown>[] = [
      ...auditedAccount[1],
      ...updatedAccountEvents,
      ...journalEvents,
      ...(fxResult?.events ?? []),
    ];

    await deps.eventBus.publish(eventValue.enrichAll(allEvents, repoOptions));

    return mapLedgerAccountToDto(
      updatedAccount,
      journalEntry,
      accountingEntity.functionalCurrencyCode
    );
  };
}
