import { InferSelectModel } from 'drizzle-orm';
import { IAccountingEntity } from '../../domain/accounting/types/accounting.types';
import { accountingEntitiesInCore } from '../../infra/persistence/drizzle/schema';
import { fromCommonRepoDates, toCommonRepoDates } from './date';
import currencyMapper, { ICurrencyModel } from './currency.mapper';
import { TEntityId } from '../../shared/types/uuid';
import { IAccountingEntityRes } from '../contracts/dto/accounting-entity.dto';

export interface IAccountingEntityModel extends InferSelectModel<
  typeof accountingEntitiesInCore
> {}

interface IAccountingEntitySelectModel extends IAccountingEntityModel {
  functionalCurrency: ICurrencyModel;
  reportingCurrency: ICurrencyModel;
}

const accountingEntityMapper = {
  toRepo(entity: IAccountingEntity): IAccountingEntityModel {
    return {
      id: entity.id,
      ownerId: entity.ownerId,
      functionalCurrencyCode: entity.functionalCurrency.code,
      reportingCurrencyCode: entity.reportingCurrency.code,
      type: entity.type,
      fiscalYearStartMonth: entity.fiscalYearStart.month,
      fiscalYearStartDay: entity.fiscalYearStart.day,
      ...toCommonRepoDates(entity),
    };
  },

  toDomain(payload: IAccountingEntitySelectModel): IAccountingEntity {
    return Object.freeze({
      id: payload.id as TEntityId,
      ownerId: payload.ownerId as TEntityId,
      functionalCurrency: currencyMapper.toDomain(payload.functionalCurrency),
      reportingCurrency: currencyMapper.toDomain(payload.reportingCurrency),
      type: payload.type,
      fiscalYearStart: Object.freeze({
        month: payload.fiscalYearStartMonth,
        day: payload.fiscalYearStartDay,
      }),
      ...fromCommonRepoDates(payload),
    });
  },

  toInterface(payload: IAccountingEntity): IAccountingEntityRes {
    return {
      ...payload,
      functionalCurrency: payload.functionalCurrency.code,
      reportingCurrency: payload.reportingCurrency.code,
    };
  },
};

export default accountingEntityMapper;
