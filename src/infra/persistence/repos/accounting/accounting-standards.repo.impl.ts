import { IAccountingStandardRepo } from '@domain/accounting/repos/accounting-standards.repo';

import { accountingStandardsInCore } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import accountingStandardMapper from '@infra/persistence/repos/accounting/mappers/accounting-standard.mapper';

const accountingStandardRepo: IAccountingStandardRepo = {
  create: async (domain, options) => {
    const query = getDbQuery(options);

    const values = Array.isArray(domain)
      ? domain.map(accountingStandardMapper.toRepo)
      : [accountingStandardMapper.toRepo(domain)];

    if (values.length === 0) return;

    await query
      .insert(accountingStandardsInCore)
      .values(values)
      .onConflictDoNothing();
  },
};

export default accountingStandardRepo;
