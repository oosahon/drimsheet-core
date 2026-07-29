import { IAccountingEntity } from '../../../../domain/accounting/types/accounting-entity.types';
import IAccountingPeriodService from '../../../../domain/accounting/types/accounting-period.service.types';
import assetAccountError from '../../../../domain/ledger/asset-account/errors/asset-account.error';
import IBankAccountRepo from '../../../../domain/ledger/asset-account/repos/bank-account.repo';
import {
  IBankValue,
  ICashAndCashEquivalentAccount,
} from '../../../../domain/ledger/asset-account/types/asset-account.types';
import { ILedgerAccount } from '../../../../domain/ledger/shared/types/ledger.types';
import IEventBus from '../../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../../shared/contracts/repo.contract';
import eventValue from '../../../../shared/events/event.vo';
import { TAuditedEntity } from '../../../../shared/events/types/event.types';
import historyValue from '../../../../shared/history/history.vo';
import { IHistoryActor } from '../../../../shared/history/types/history.types';
import {
  ERepoLock,
  IReadRepoOptions,
  IRepoOptions,
} from '../../../../shared/types/repo.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { IOpeningBalanceDto } from '../../../journal-entry/dtos/opening-balance/opening-balance.dto';
import ILedgerAccountPersistenceService from '../../contracts/ledger-account-persistence.service.contract';
import { IBankDetailsCreationReq } from '../../dtos/asset-account/asset-account.dto';
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
      { ...repoOptions, lock: ERepoLock.Share }
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
    throw new assetAccountError.DuplicateBankAccount({ details });
  }
}

async function finalizeWithoutOpeningBalance(
  deps: IDependencies,
  auditedAccount: TAuditedEntity<
    ICashAndCashEquivalentAccount,
    ICashAndCashEquivalentAccount,
    ILedgerAccount
  >,
  accountingEntity: IAccountingEntity,
  bankDetails: IBankValue,
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
