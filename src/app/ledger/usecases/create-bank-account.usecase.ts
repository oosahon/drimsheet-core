import IAccountingPeriodService from '../../../domain/accounting/types/accounting-period.service.types';
import IBankAccountRepo from '../../../domain/ledger/asset-account/repos/bank-account.repo';
import IAssetAccountService from '../../../domain/ledger/asset-account/types/asset-account.service.types';
import bankDetailsValue from '../../../domain/ledger/asset-account/values/bank-details.vo';
import ledgerAccountEntity from '../../../domain/ledger/shared/entities/ledger-account.entity';
import { TCashLedgerCode } from '../../../domain/ledger/shared/types/ledger-code.types';
import currencyEntity from '../../../domain/money/entities/currency.entity';
import IFxCostBasisLotDomainService from '../../../domain/subledger/fx-cost-basis/types/lot.service.types';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import eventValue from '../../../shared/events/event.vo';
import { IEvent } from '../../../shared/events/types/event.types';
import historyValue from '../../../shared/history/history.vo';
import { ERepoLock } from '../../../shared/types/repo.types';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import IAppContext from '../../context/contracts/app-context.contract';
import IJournalEntryPersistenceService from '../../journal-entry/contracts/journal-entry-persistence.service.contract';
import IOpeningBalanceEntryService from '../../journal-entry/contracts/opening-balance-entry.service.contract';
import IExchangeRateAppService from '../../money/contracts/exchange-rate.service.contract';
import moneyMapper from '../../money/dtos/money/money.dto.mapper';
import IFxCostBasisPersistenceService from '../../subledger/fx-cost-basis/contracts/fx-cost-basis-persistence.service.contract';
import { ILedgerAccountBalancePropagationService } from '../contracts/ledger-account-balance-propagation.service.contract';
import ILedgerAccountPersistenceService from '../contracts/ledger-account-persistence.service.contract';
import { IBankAccountCreationReq } from '../dtos/asset-account/asset-account.dto';
import { bankAccountCreationReqValidation } from '../dtos/asset-account/asset-account.dto.validation';
import { ILedgerAccountDto } from '../dtos/ledger-account/ledger-account.dto';
import helpers from './helpers/create-bank-account.usecase.helpers';
import getFxAcquisitionDataHelper from './helpers/get-fx-acquisition-data.helper';
import getOpeningBalanceExchangeRate from './helpers/get-opening-balance-exchange-rate.helper';
import mapLedgerAccountToDto from './helpers/map-ledger-account-to-dto.helper';
import validateOpeningBalanceExchangeRate from './helpers/validate-opening-balance-exchange-rate.helper';

interface IDependencies {
  appContext: IAppContext;
  eventBus: IEventBus;
  accountingPeriodService: IAccountingPeriodService;
  assetAccountService: IAssetAccountService;
  bankAccountRepo: IBankAccountRepo;
  openingBalanceEntryService: IOpeningBalanceEntryService;
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

    const creationPayload = {
      name: payload.name,
      currency: currencyEntity.getByCode(payload.currencyCode),
      userId: user.id,
      accountingEntity,
      controlAccountCode: payload.controlAccountCode as TCashLedgerCode,
      bankDetails,
    };

    const auditedAccount = await deps.assetAccountService.makeBankSubAccount(
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
      await deps.openingBalanceEntryService.create(
        accountingEntity,
        auditedAccount[0],
        moneyMapper.fromDto(payload.openingBalance.amount),
        payload.openingBalance.date,
        exchangeRate,
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
