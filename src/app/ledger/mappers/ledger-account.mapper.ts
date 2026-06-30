import { InferSelectModel } from 'drizzle-orm';
import { ILedgerAccount } from '../../../domain/ledger/shared/types/ledger.types';
import { ledgerAccountsInCore } from '../../../infra/config/drizzle/schema';
import { IMoney } from '../../../shared/types/money.types';
import { TEntityId } from '../../../shared/types/uuid';
import currencyMapper, {
  ICurrencyModel,
} from '../../currency/mappers/currency.mapper';
import {
  fromCommonRepoDates,
  toCommonRepoDates,
} from '../../shared/mappers/date';
import moneyMapper from '../../shared/mappers/money.mapper';
import { ILedgerAccountDto } from '../dtos/ledger-account.dto';

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
      createdBy: model.createdBy as TEntityId,
      ...fromCommonRepoDates(model),
    };
  },

  toDto(
    payload: ILedgerAccount,
    balance: IMoney,
    functionalBalance: IMoney
  ): ILedgerAccountDto {
    return {
      id: payload.id,
      code: payload.code,
      materializedPath: payload.materializedPath,
      accountingEntityId: payload.accountingEntityId,
      type: payload.type,
      normalBalance: payload.normalBalance,
      subType: payload.subType,
      behavior: payload.behavior,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId ?? undefined,
      name: payload.name,
      status: payload.status,
      contraAccountRule: payload.contraAccountRule,
      adjunctAccountRule: payload.adjunctAccountRule,
      meta: undefined, // TODO: replace with actual metadata when its decided
      createdBy: payload.createdBy,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      deletedAt: payload.deletedAt ?? undefined,
      balance: moneyMapper.toDto(balance),
      functionalBalance: moneyMapper.toDto(functionalBalance),
    };
  },
};

export default ledgerAccountMapper;
