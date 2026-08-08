import IReporter from '@shared/contracts/reporter.contract';
import zodValidationRunner from '@shared/utils/zod-validation-runner';
import paginationValue from '@shared/values/pagination/pagination.vo';
import { IPaginatedResponse } from '@shared/values/pagination/types/pagination.types';

import ILedgerAccountBalanceRepo from '@domain/ledger/repos/ledger-account-balance.repo';
import ILedgerAccountRepo, {
  IFindAllLedgerAccountsOptions,
} from '@domain/ledger/repos/ledger-account.repo';
import currencyEntity from '@domain/money/entities/currency.entity';
import moneyValue from '@domain/money/values/money.vo';

import IAppContext from '@app/context/contracts/app-context.contract';
import {
  IGetLedgerAccountsQuery,
  ILedgerAccountDto,
} from '@app/ledger/dtos/ledger-account/ledger-account.dto';
import ledgerAccountMapper from '@app/ledger/dtos/ledger-account/ledger-account.dto.mapper';
import { getLedgerAccountQueryValidationSchema } from '@app/ledger/dtos/ledger-account/ledger-account.dto.validation';
import ledgerAppError from '@app/ledger/errors/ledger.error';

interface IDependencies {
  appContext: IAppContext;
  reporter: IReporter;
  ledgerAccountRepo: ILedgerAccountRepo;
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo;
}

export default function makeGetLedgerAccountsUsecase(deps: IDependencies) {
  return async (
    query: IGetLedgerAccountsQuery
  ): Promise<IPaginatedResponse<ILedgerAccountDto>> => {
    zodValidationRunner(getLedgerAccountQueryValidationSchema, query);
    const { correlationId, accountingEntity } = deps.appContext.get();

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
          new ledgerAppError.BalanceNotFound({ accountId: account.id })
        );

        const functionalCurrency = currencyEntity.getByCode(
          accountingEntity.functionalCurrencyCode
        );
        const zeroBalance = moneyValue.makeZeroAmount(
          account.currency ?? functionalCurrency
        );
        const functionalBalance = moneyValue.makeZeroAmount(functionalCurrency);

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
