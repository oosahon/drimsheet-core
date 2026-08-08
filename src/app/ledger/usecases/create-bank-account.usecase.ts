import IEventBus from '@shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '@shared/contracts/repo.contract';
import { ERepoLock } from '@shared/types/repo.types';
import zodValidationRunner from '@shared/utils/zod-validation-runner';
import eventValue from '@shared/values/events/event.vo';
import { IEvent } from '@shared/values/events/types/event.types';
import historyValue from '@shared/values/history/history.vo';

import IAccountingPeriodService from '@domain/accounting/types/accounting-period.service.types';
import { IJournalEntryService } from '@domain/journal-entry/types/journal-entry.service.types';
import { ASSET_LEDGER_CODES } from '@domain/ledger/config/asset-codes.config';
import ledgerAccountEntity from '@domain/ledger/entities/ledger-account.entity';
import IBankAccountRepo from '@domain/ledger/repos/bank-account.repo';
import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import ICashAccountService from '@domain/ledger/types/cash-account.service.types';
import { TCashLedgerCode } from '@domain/ledger/types/ledger-code.types';
import bankDetailsValue from '@domain/ledger/values/bank-details.vo';
import currencyEntity from '@domain/money/entities/currency.entity';
import IFxCostBasisLotDomainService from '@domain/subledger/fx-cost-basis/types/lot.service.types';

import IAppContext from '@app/context/contracts/app-context.contract';
import IJournalEntryPersistenceService from '@app/journal-entry/contracts/journal-entry-persistence.service.contract';
import { ILedgerAccountBalancePropagationService } from '@app/ledger/contracts/ledger-account-balance-propagation.service.contract';
import ILedgerAccountPersistenceService from '@app/ledger/contracts/ledger-account-persistence.service.contract';
import { IBankAccountCreationReq } from '@app/ledger/dtos/asset-account/asset-account.dto';
import { bankAccountCreationReqValidation } from '@app/ledger/dtos/asset-account/asset-account.dto.validation';
import { ILedgerAccountDto } from '@app/ledger/dtos/ledger-account/ledger-account.dto';
import helpers from '@app/ledger/usecases/helpers/create-bank-account.usecase.helpers';
import getControlAccountHelper from '@app/ledger/usecases/helpers/get-control-account.helper';
import getFxAcquisitionDataHelper from '@app/ledger/usecases/helpers/get-fx-acquisition-data.helper';
import getOpeningBalanceExchangeRate from '@app/ledger/usecases/helpers/get-opening-balance-exchange-rate.helper';
import mapLedgerAccountToDto from '@app/ledger/usecases/helpers/map-ledger-account-to-dto.helper';
import validateOpeningBalanceExchangeRate from '@app/ledger/usecases/helpers/validate-opening-balance-exchange-rate.helper';
import IExchangeRateAppService from '@app/money/contracts/exchange-rate.service.contract';
import moneyMapper from '@app/money/dtos/money/money.dto.mapper';
import IFxCostBasisPersistenceService from '@app/subledger/fx-cost-basis/contracts/fx-cost-basis-persistence.service.contract';

interface IDependencies {
  appContext: IAppContext;
  eventBus: IEventBus;
  accountingPeriodService: IAccountingPeriodService;
  cashAccountService: ICashAccountService;
  bankAccountRepo: IBankAccountRepo;
  ledgerAccountRepo: ILedgerAccountRepo;
  journalEntryService: IJournalEntryService;
  journalEntryPersistenceService: IJournalEntryPersistenceService;
  balancePropagationService: ILedgerAccountBalancePropagationService;
  repoService: IRepoService;
  ledgerAccountPersistenceService: ILedgerAccountPersistenceService;
  fxCostBasisPersistenceService: IFxCostBasisPersistenceService;
  fxCostBasisService: IFxCostBasisLotDomainService;
  exchangeRateService: IExchangeRateAppService;
}

export default function makeCreateBankAccountUseCase(deps: IDependencies) {
  return async (
    payload: IBankAccountCreationReq
  ): Promise<ILedgerAccountDto> => {
    const { correlationId, user, accountingEntity } = deps.appContext.get();
    const actor = historyValue.getUserActor(user.id);
    const trace = { correlationId };

    // Validate data
    zodValidationRunner(bankAccountCreationReqValidation, payload);

    validateOpeningBalanceExchangeRate(
      accountingEntity.functionalCurrencyCode,
      payload.currencyCode,
      payload.openingBalance
    );

    await helpers.validatePostingPeriod(
      deps,
      accountingEntity.id,
      payload.openingBalance,
      trace
    );

    await helpers.checkForExistingBankAccount(deps, payload.bankAccount, trace);

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
      repoOptions: trace,
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
      { ...trace, lock: ERepoLock.Update }
    );

    if (!payload.openingBalance) {
      return await helpers.finalizeWithoutOpeningBalance(
        deps,
        auditedAccount,
        accountingEntity,
        bankDetails,
        actor,
        trace
      );
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
        trace
      );

    const [updatedAccount, updatedAccountEvents, updatedAccountAudit] =
      ledgerAccountEntity.updateOpeningBalanceDate(
        auditedAccount[0],
        payload.openingBalance.date
      );

    const fxLotDataGetterPayload = {
      account: updatedAccount,
      journalEntry,
      exchangeRate,
      functionalCurrencyCode: accountingEntity.functionalCurrencyCode,
      repoOptions: trace,
    };

    const fxLotData = await getFxAcquisitionDataHelper(
      deps,
      fxLotDataGetterPayload
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

    const fxLotHistory = fxLotData
      ? historyValue.make(fxLotData.lot[2], actor, correlationId)
      : null;
    const fxAcquisitionHistory = fxLotData
      ? historyValue.make(fxLotData.acquisition[2], actor, correlationId)
      : null;

    // Persist entities
    const dbTransactionFn: TRepoTransactionFn = async (tx) => {
      const writeRepoOptions = { ...trace, tx };

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

      if (fxLotData) {
        await deps.fxCostBasisPersistenceService.persistAcquisition(
          fxLotData.lot[0],
          fxLotData.acquisition[0],
          fxLotHistory!,
          fxAcquisitionHistory!,
          writeRepoOptions
        );
      }
    };

    await deps.repoService.runInTransaction(dbTransactionFn);

    // Propagate balance adjustment
    await deps.balancePropagationService.propagate(journalEntry, trace);

    // Assemble events
    const allEvents: IEvent<unknown>[] = [
      ...auditedAccount[1],
      ...updatedAccountEvents,
      ...journalEvents,
      ...(fxLotData?.lot[1] ?? []),
      ...(fxLotData?.acquisition[1] ?? []),
    ];

    await deps.eventBus.publish(eventValue.enrichAll(allEvents, trace));

    return mapLedgerAccountToDto(
      updatedAccount,
      journalEntry,
      accountingEntity.functionalCurrencyCode
    );
  };
}
