import { IJournalEntry } from '../../../../domain/journal-entry/types/journal-entry.types';
import { ILedgerAccount } from '../../../../domain/ledger/types/ledger.types';
import { IExchangeRate } from '../../../../domain/money/types/exchange-rate.types';
import IFxCostBasisLotDomainService from '../../../../domain/subledger/fx-cost-basis/types/lot.service.types';
import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import IExchangeRateAppService from '../../../money/contracts/exchange-rate.service.contract';

interface IDependencies {
  fxCostBasisService: IFxCostBasisLotDomainService;
  exchangeRateService: IExchangeRateAppService;
}

interface IPayload {
  account: ILedgerAccount;
  journalEntry: IJournalEntry;
  exchangeRate: IExchangeRate | null;
  functionalCurrencyCode: string;
  repoOptions: IReadRepoOptions;
}

type TResult = ReturnType<IFxCostBasisLotDomainService['acquire']> | null;

export default async function getFxAcquisitionDataHelper(
  deps: IDependencies,
  payload: IPayload
): Promise<TResult> {
  const {
    account,
    journalEntry,
    exchangeRate,
    functionalCurrencyCode,
    repoOptions,
  } = payload;

  const shouldNotCreate =
    !exchangeRate || account.currency.code === functionalCurrencyCode;

  if (shouldNotCreate) {
    return null;
  }

  const debitLine = journalEntry.lines.find((v) => v.accountId === account.id)!;

  const officialRate = await deps.exchangeRateService.getOfficialRate(
    exchangeRate.currencyPair,
    exchangeRate.asOf,
    repoOptions,
    exchangeRate
  );

  return deps.fxCostBasisService.acquire({
    ledgerAccountId: account.id,
    accountingEntityId: account.accountingEntityId,
    journalEntryId: journalEntry.id,
    quantity: debitLine.amount,
    costBasis: debitLine.functionalAmount,
    acquisitionRate: exchangeRate,
    acquisitionDate: journalEntry.effectiveDate,
    officialRate,
  });
}
