import IEventBus from '@shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '@shared/contracts/repo.contract';
import { IReadRepoOptions, IRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';
import eventValue from '@shared/values/events/event.vo';
import { TAuditedEntity } from '@shared/values/events/types/event.types';
import historyValue from '@shared/values/history/history.vo';
import { IHistoryActor } from '@shared/values/history/types/history.types';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';
import IAccountingPeriodService from '@domain/accounting/types/accounting-period.service.types';
import ledgerAccountError from '@domain/ledger/errors/ledger-account.error';
import IBankAccountRepo from '@domain/ledger/repos/bank-account.repo';
import {
  IBankDetails,
  ICashAndCashEquivalentAccount,
} from '@domain/ledger/types/asset-account.types';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';

import { IOpeningBalanceDto } from '@app/journal-entry/dtos/opening-balance/opening-balance.dto';
import ILedgerAccountPersistenceService from '@app/ledger/contracts/ledger-account-persistence.service.contract';
import { IBankDetailsCreationReq } from '@app/ledger/dtos/asset-account/asset-account.dto';

import mapLedgerAccountToDto from './map-ledger-account-to-dto.helper';

interface IDependencies {
  eventBus: IEventBus;
  accountingPeriodService: IAccountingPeriodService;
  bankAccountRepo: IBankAccountRepo;
  repoService: IRepoService;
  ledgerAccountPersistenceService: ILedgerAccountPersistenceService;
}

async function validatePostingPeriod(
  deps: IDependencies,
  accountingEntityId: TEntityId,
  openingBalance: IOpeningBalanceDto | null,
  repoOptions: IRepoOptions
) {
  if (openingBalance) {
    await deps.accountingPeriodService.validatePostingPeriod(
      accountingEntityId,
      openingBalance.date,
      repoOptions
    );
  }
}

async function checkForExistingBankAccount(
  deps: IDependencies,
  details: IBankDetailsCreationReq,
  repoOptions: IReadRepoOptions
) {
  const existing = await deps.bankAccountRepo.findOne(
    details.bankName,
    details.accountNumber,
    repoOptions
  );

  if (existing) {
    throw new ledgerAccountError.DuplicateBankAccount({ details });
  }
}

// TODO: this should be an app service. Similar to `src/app/ledger/usecases/helpers/create-petty-cash-account.usecase.helpers.ts`
async function finalizeWithoutOpeningBalance(
  deps: IDependencies,
  auditedAccount: TAuditedEntity<
    ICashAndCashEquivalentAccount,
    ICashAndCashEquivalentAccount,
    ILedgerAccount
  >,
  accountingEntity: IAccountingEntity,
  bankDetails: IBankDetails,
  actor: IHistoryActor,
  repoOptions: IReadRepoOptions
) {
  const [account, events, history] = auditedAccount;

  const accountHistory = historyValue.make(
    history,
    actor,
    repoOptions.correlationId
  );

  const transactionFn: TRepoTransactionFn = async (tx) => {
    const writeRepoOptions = { ...repoOptions, tx };

    await deps.ledgerAccountPersistenceService.create(
      account,
      accountingEntity.functionalCurrencyCode,
      { ...writeRepoOptions, history: [accountHistory] }
    );

    await deps.bankAccountRepo.create(
      account.id,
      accountingEntity.id,
      bankDetails,
      writeRepoOptions
    );
  };

  await deps.repoService.runInTransaction(transactionFn);

  await deps.eventBus.publish(eventValue.enrichAll(events, repoOptions));

  return mapLedgerAccountToDto(
    account,
    null,
    accountingEntity.functionalCurrencyCode
  );
}

const createBankAccountUseCaseHelpers = Object.freeze({
  validatePostingPeriod,
  checkForExistingBankAccount,
  finalizeWithoutOpeningBalance,
});

export default createBankAccountUseCaseHelpers;
