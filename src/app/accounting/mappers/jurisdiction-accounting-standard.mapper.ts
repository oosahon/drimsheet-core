import { InferInsertModel } from 'drizzle-orm';
import { UAccountingEntityType } from '../../../domain/accounting/types/accounting-entity.types';
import { IJurisdictionAccountingStandard } from '../../../domain/accounting/types/jurisdiction.types';
import { jurisdictionAccountingStandardsInCore } from '../../../infra/config/drizzle/schema';

export type IJurisdictionAccountingStandardModel = InferInsertModel<
  typeof jurisdictionAccountingStandardsInCore
>;

const jurisdictionAccountingStandardMapper = {
  toRepo(
    entity: IJurisdictionAccountingStandard
  ): IJurisdictionAccountingStandardModel {
    return {
      jurisdictionCode: entity.jurisdictionCode,
      accountingStandardCode: entity.accountingStandardCode,
      accountingEntityType:
        entity.accountingEntityType as UAccountingEntityType,
    };
  },
};

export default jurisdictionAccountingStandardMapper;
