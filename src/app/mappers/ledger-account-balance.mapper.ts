import { InferSelectModel } from 'drizzle-orm';
import {
  ILedgerAccountBalance,
  ILedgerAccountBalanceAdjustment,
  INewLedgerAccountBalanceAndAdjustment,
} from '../../domain/bookkeeping/types/ledger-account-balance.types';
import {
  ledgerAccountBalanceAdjustmentsInCore,
  ledgerAccountBalancesInCore,
} from '../../infra/config/drizzle/schema';
import { TEntityId } from '../../shared/types/uuid';
import { ICurrencyModel } from './currency.mapper';
import { fromRepoDate, toRepoDate } from './date';
import moneyMapper from './money.mapper';

export interface ILedgerAccountBalanceModel extends InferSelectModel<
  typeof ledgerAccountBalancesInCore
> {}

interface ILedgerAccountBalanceRepoSelect extends ILedgerAccountBalanceModel {
  functionalCurrency: ICurrencyModel;
  currency: ICurrencyModel;
}

export interface ILedgerAccountBalanceAdjustmentModel extends InferSelectModel<
  typeof ledgerAccountBalanceAdjustmentsInCore
> {}

export interface INewLedgerAccountBalanceAndAdjustmentModel {
  newBalance: ILedgerAccountBalanceModel;
  adjustment: ILedgerAccountBalanceAdjustmentModel;
}

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

  fromRepo(payload: ILedgerAccountBalanceModel): ILedgerAccountBalance {
    return {
      ledgerAccountId: payload.ledgerAccountId as TEntityId,
      accountingEntityId: payload.accountingEntityId as TEntityId,
      accountMaterializedPath: payload.accountMaterializedPath,
      amount: moneyMapper.fromRepo(payload.amount, payload.currencyCode),
      functionalAmount: moneyMapper.fromRepo(
        payload.functionalAmount,
        payload.functionalCurrencyCode
      ),
      version: payload.version,
      createdAt: fromRepoDate(payload.createdAt),
      updatedAt: fromRepoDate(payload.updatedAt),
    };
  },

  fromRepoAdjustment(
    payload: ILedgerAccountBalanceAdjustmentModel
  ): ILedgerAccountBalanceAdjustment {
    const amount = moneyMapper.fromRepo(payload.amount, payload.currencyCode);
    const functionalAmount = moneyMapper.fromRepo(
      payload.functionalAmount,
      payload.functionalCurrencyCode
    );

    return {
      id: payload.id as TEntityId,
      ledgerAccountId: payload.ledgerAccountId as TEntityId,
      amount,
      functionalAmount,
      journalEntryId: payload.journalEntryId as TEntityId,
      transactionId: payload.transactionId as TEntityId,
      effect: payload.effect,
      createdBy: payload.createdBy as TEntityId,
      createdAt: fromRepoDate(payload.createdAt),
    };
  },

  toRepoNewBalanceAndAdjustment(
    payload: INewLedgerAccountBalanceAndAdjustment
  ): INewLedgerAccountBalanceAndAdjustmentModel {
    return {
      newBalance: this.toRepo(payload.newBalance),
      adjustment: this.toRepoAdjustment(payload.adjustment),
    };
  },

  fromRepoNewBalanceAndAdjustment(
    payload: INewLedgerAccountBalanceAndAdjustmentModel
  ): INewLedgerAccountBalanceAndAdjustment {
    return {
      newBalance: this.fromRepo(payload.newBalance),
      adjustment: this.fromRepoAdjustment(payload.adjustment),
    };
  },
};

export default ledgerAccountBalanceMapper;
