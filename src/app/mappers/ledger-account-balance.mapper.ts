import { InferSelectModel } from 'drizzle-orm';
import {
  ILedgerAccountBalance,
  ILedgerAccountBalanceAdjustment,
} from '../../domain/accounting/types/ledger-account-balance.types';
import {
  ledgerAccountBalanceAdjustmentsInCore,
  ledgerAccountBalancesInCore,
} from '../../infra/config/drizzle/schema';
import { TEntityId } from '../../shared/types/uuid';
import { ICurrencyModel } from './currency.mapper';
import { fromRepoDate, toRepoDate } from './date';
import moneyMapper from './money.mapper';

interface ILedgerAccountBalanceModel extends InferSelectModel<
  typeof ledgerAccountBalancesInCore
> {}

interface ILedgerAccountBalanceRepoSelect extends ILedgerAccountBalanceModel {
  functionalCurrency: ICurrencyModel;
  currency: ICurrencyModel;
}

export interface ILedgerAccountBalanceAdjustmentModel extends InferSelectModel<
  typeof ledgerAccountBalanceAdjustmentsInCore
> {}

const ledgerAccountBalanceMapper = {
  toRepo(payload: ILedgerAccountBalance): ILedgerAccountBalanceModel {
    const { amount, currencyCode } = moneyMapper.toDto(payload.amount);
    const { amount: functionalAmount, currencyCode: functionalCurrencyCode } =
      moneyMapper.toDto(payload.functionalAmount);

    return {
      ledgerAccountId: payload.ledgerAccountId,
      accountingEntityId: payload.accountingEntityId,
      accountMaterializedPath: payload.accountMaterializedPath,
      amount,
      currencyCode,
      functionalAmount,
      functionalCurrencyCode,
      version: payload.version,
      createdAt: toRepoDate(payload.createdAt),
      updatedAt: toRepoDate(payload.updatedAt),
    };
  },

  toDomain(payload: ILedgerAccountBalanceRepoSelect): ILedgerAccountBalance {
    const amount = moneyMapper.fromRepo(payload.amount, payload.currency.code);

    const functionalAmount = moneyMapper.fromRepo(
      payload.functionalAmount,
      payload.functionalCurrency.code
    );

    return {
      ledgerAccountId: payload.ledgerAccountId as TEntityId,
      accountingEntityId: payload.accountingEntityId as TEntityId,
      accountMaterializedPath: payload.accountMaterializedPath,
      amount,
      functionalAmount,
      version: payload.version,
      createdAt: fromRepoDate(payload.createdAt),
      updatedAt: fromRepoDate(payload.updatedAt),
    };
  },

  toRepoAdjustment(
    payload: ILedgerAccountBalanceAdjustment
  ): ILedgerAccountBalanceAdjustmentModel {
    const { amount, currencyCode } = moneyMapper.toDto(payload.amount);
    const { amount: functionalAmount, currencyCode: functionalCurrencyCode } =
      moneyMapper.toDto(payload.functionalAmount);

    return {
      id: payload.id,
      ledgerAccountId: payload.ledgerAccountId,
      amount,
      currencyCode,
      functionalAmount,
      functionalCurrencyCode,
      journalEntryId: payload.journalEntryId,
      transactionId: payload.transactionId,
      effect: payload.effect,
      createdBy: payload.createdBy,
      createdAt: toRepoDate(payload.createdAt),
    };
  },
};

export default ledgerAccountBalanceMapper;
