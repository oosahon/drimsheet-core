import ILedgerAccountBalanceRepo from '../../../../domain/bookkeeping/repos/ledger-account-balance.repo';
import currencyEntity from '../../../../domain/currency/entities/currency.entity';
import ILedgerAccountRepo, {
  IFindAllLedgerAccountsOptions,
} from '../../../../domain/ledger/repos/ledger-account.repo';
import { IPaginatedResponse } from '../../../../shared/types/pagination.types';
import zodValidationRunner from '../../../../shared/utils/zod-validation-runner';
import moneyValue from '../../../../shared/value-objects/money.vo';
import IRequestContext from '../../../contracts/app/request-context.contract';
import {
  getLedgerAccountQueryValidationSchema,
  IGetLedgerAccountsQuery,
  ILedgerAccountDto,
} from '../../../contracts/dto/ledger-account.dto';
import IReporter from '../../../contracts/infra/reporter.contract';
import ledgerAccountMapper from '../../../mappers/ledger-account.mapper';

export default function makeGetLedgerAccountsUsecase(
  requestContext: IRequestContext,
  reporter: IReporter,
  ledgerAccountRepo: ILedgerAccountRepo,
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo
) {
  return async (
    query: IGetLedgerAccountsQuery
  ): Promise<IPaginatedResponse<ILedgerAccountDto>> => {
    zodValidationRunner(getLedgerAccountQueryValidationSchema, query);
    const { correlationId, accountingEntity } = requestContext.get();

    const trace = { correlationId };
    const accountRepoOptions: IFindAllLedgerAccountsOptions = {
      ...query,
      ...trace,
    };

    const ledgerAccountsRes = await ledgerAccountRepo.findAll(
      accountingEntity.id,
      accountRepoOptions
    );

    if (ledgerAccountsRes.data.length === 0) {
      return {
        data: [],
        meta: ledgerAccountsRes.meta,
      };
    }

    const balances = await ledgerAccountBalanceRepo.findAllByAccountIds(
      accountingEntity.id,
      ledgerAccountsRes.data.map((account) => account.id),
      trace
    );

    const data: ILedgerAccountDto[] = [];

    for (const account of ledgerAccountsRes.data) {
      const balance = balances.find((b) => b.ledgerAccountId === account.id);

      if (!balance) {
        reporter.report(
          new Error(`No balance found for ledger account with id ${account.id}`)
        );

        const zeroBalance = moneyValue.makeZeroAmount(account.currency);
        const functionalBalance = moneyValue.makeZeroAmount(
          currencyEntity.getByCode(accountingEntity.functionalCurrencyCode)
        );

        data.push(
          ledgerAccountMapper.toDto(account, zeroBalance, functionalBalance)
        );

        continue;
      }

      data.push(
        ledgerAccountMapper.toDto(
          account,
          balance.amount,
          balance.functionalAmount
        )
      );
    }

    return {
      data,
      meta: ledgerAccountsRes.meta,
    };
  };
}
