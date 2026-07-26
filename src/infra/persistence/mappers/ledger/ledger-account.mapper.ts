import { InferSelectModel } from 'drizzle-orm';
import { ILedgerAccount } from '../../../../domain/ledger/shared/types/ledger.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { ledgerAccountsInCore } from '../../../config/drizzle/schema';
import currencyMapper, { ICurrencyModel } from '../money/currency.mapper';
import {
  fromCommonRepoDates,
  fromRepoDate,
  toCommonRepoDates,
  toRepoDateOnly,
} from '../shared/date';

export interface ILedgerAccountModel extends InferSelectModel<
  typeof ledgerAccountsInCore
> {}

const ledgerAccountMapper = {
  toRepo(account: ILedgerAccount): ILedgerAccountModel {
    return {
      id: account.id,
      code: account.code,
      materializedPath: account.materializedPath,
      accountingEntityId: account.accountingEntityId,

      type: account.type,
      normalBalance: account.normalBalance,
      subType: account.subType,
      behavior: account.behavior,
      isControlAccount: account.isControlAccount,
      controlAccountId: account.controlAccountId,
      name: account.name,
      currencyCode: account.currency.code,
      status: account.status,
      contraAccountRule: account.contraAccountRule,
      adjunctAccountRule: account.adjunctAccountRule,
      meta: account.meta,
      openingBalanceDate: account.openingBalanceDate
        ? toRepoDateOnly(account.openingBalanceDate)
        : null,
      createdBy: account.createdBy,
      ...toCommonRepoDates(account),
    };
  },

  toDomain(
    res: ILedgerAccountModel & { currency: ICurrencyModel }
  ): ILedgerAccount {
    const { currency, ...model } = res;

    return {
      id: model.id as TEntityId,
      code: model.code,
      materializedPath: model.materializedPath,
      accountingEntityId: model.accountingEntityId as TEntityId,

      type: model.type,
      normalBalance: model.normalBalance,
      subType: model.subType,
      behavior: model.behavior,
      isControlAccount: model.isControlAccount,
      controlAccountId: model.controlAccountId as TEntityId,
      name: model.name,
      currency: currencyMapper.toDomain(currency),
      status: model.status,
      contraAccountRule: model.contraAccountRule,
      adjunctAccountRule: model.adjunctAccountRule,
      meta: model.meta as object | null,
      openingBalanceDate: model.openingBalanceDate
        ? fromRepoDate(model.openingBalanceDate)
        : null,
      createdBy: model.createdBy as TEntityId,
      ...fromCommonRepoDates(model),
    };
  },
};

export default ledgerAccountMapper;
