import { InferSelectModel } from 'drizzle-orm';
import { ILedgerAccount } from '../../domain/ledger/types/ledger.types';
import { ledgerAccountsInCore } from '../../infra/persistence/drizzle/schema';
import { fromCommonRepoDates, toCommonRepoDates } from './date';
import { TEntityId } from '../../shared/types/uuid';
import currencyMapper, { ICurrencyModel } from './currency.mapper';

export interface ILedgerAccountModel extends InferSelectModel<
  typeof ledgerAccountsInCore
> {}

const ledgerAccountMapper = {
  toRepo(account: ILedgerAccount): ILedgerAccountModel {
    return {
      id: account.id,
      code: account.code,
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
      createdBy: account.createdBy,
      ...toCommonRepoDates(account),
    };
  },

  toDomain(
    model: ILedgerAccountModel,
    currency: ICurrencyModel
  ): ILedgerAccount {
    return {
      id: model.id as TEntityId,
      code: model.code,
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
      createdBy: model.createdBy as TEntityId,
      ...fromCommonRepoDates(model),
    };
  },
};

export default ledgerAccountMapper;
