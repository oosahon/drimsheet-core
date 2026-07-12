import currencyEntity from '../../../domain/currency/entities/currency.entity';
import ILedgerAccountBalanceRepo from '../../../domain/ledger/account-balance/repos/ledger-account-balance.repo';
import ILedgerAccountRepo, {
  IFindAllLedgerAccountsOptions,
} from '../../../domain/ledger/shared/repos/ledger-account.repo';
import IReporter from '../../../shared/contracts/reporter.contract';
import { IPaginatedResponse } from '../../../shared/types/pagination.types';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import moneyValue from '../../../shared/value-objects/money.vo';
import paginationValue from '../../../shared/value-objects/pagination.vo';
import IRequestContext from '../../shared/contracts/request-context.contract';
import {
  getLedgerAccountQueryValidationSchema,
  IGetLedgerAccountsQuery,
  ILedgerAccountDto,
} from '../dtos/ledger-account.dto';
import ledgerAccountMapper from '../mappers/ledger-account.mapper';

interface IDependencies {
  requestContext: IRequestContext;
  reporter: IReporter;
  ledgerAccountRepo: ILedgerAccountRepo;
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo;
}

export default function makeGetLedgerAccountsUsecase(deps: IDependencies) {
  return async (
    query: IGetLedgerAccountsQuery
  ): Promise<IPaginatedResponse<ILedgerAccountDto>> => {
    zodValidationRunner(getLedgerAccountQueryValidationSchema, query);
    const { correlationId, accountingEntity } = deps.requestContext.get();

    const trace = { correlationId };
    const offset = paginationValue.pageToOffset(query.page, query.limit);
    const accountRepoOptions: IFindAllLedgerAccountsOptions = {
      ...query,
      offset,
      ...trace,
    };

    const ledgerAccountsRes = await deps.ledgerAccountRepo.findAll(
      accountingEntity.id,
      accountRepoOptions
    );

    if (ledgerAccountsRes.data.length === 0) {
      return {
        data: [],
        meta: ledgerAccountsRes.meta,
      };
    }

    const balances = await deps.ledgerAccountBalanceRepo.findAllByAccountIds(
      accountingEntity.id,
      ledgerAccountsRes.data.map((account) => account.id),
      trace
    );

    const data: ILedgerAccountDto[] = [];

    for (const account of ledgerAccountsRes.data) {
      const balance = balances.find((b) => b.ledgerAccountId === account.id);

      if (!balance) {
        deps.reporter.report(
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
