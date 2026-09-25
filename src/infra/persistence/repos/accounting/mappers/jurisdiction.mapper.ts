import { InferInsertModel } from 'drizzle-orm';

import { TEntityId } from '@shared/types/uuid';

import { IJurisdiction } from '@domain/accounting/types/jurisdiction.types';

import { jurisdictionsInCore } from '@infra/config/drizzle/schema';

export type IJurisdictionModel = InferInsertModel<typeof jurisdictionsInCore>;

const jurisdictionMapper = {
  toRepo(entity: IJurisdiction, createdBy: TEntityId): IJurisdictionModel {
    return {
      code: entity.code,
      createdBy,
      name: entity.name,
      currencyCode: entity.currency.code,
    };
  },
};

export default jurisdictionMapper;
