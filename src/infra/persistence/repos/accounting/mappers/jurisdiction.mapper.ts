import { InferInsertModel } from 'drizzle-orm';

import { IJurisdiction } from '@domain/accounting/types/jurisdiction.types';

import { jurisdictionsInCore } from '@infra/config/drizzle/schema';

export type IJurisdictionModel = InferInsertModel<typeof jurisdictionsInCore>;

const jurisdictionMapper = {
  toRepo(entity: IJurisdiction): IJurisdictionModel {
    return {
      code: entity.code,
      name: entity.name,
      currencyCode: entity.currency.code,
    };
  },
};

export default jurisdictionMapper;
