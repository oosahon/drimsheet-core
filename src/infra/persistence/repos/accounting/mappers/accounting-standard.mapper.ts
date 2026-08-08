import { InferInsertModel } from 'drizzle-orm';

import { IAccountingStandard } from '@domain/accounting/types/accounting-standards.types';

import { accountingStandardsInCore } from '@infra/config/drizzle/schema';

export type IAccountingStandardModel = InferInsertModel<
  typeof accountingStandardsInCore
>;

const accountingStandardMapper = {
  toRepo(entity: IAccountingStandard): IAccountingStandardModel {
    return {
      code: entity.code,
      name: entity.name,
      link: entity.link,
      isSupported: entity.isSupported,
    };
  },
};

export default accountingStandardMapper;
