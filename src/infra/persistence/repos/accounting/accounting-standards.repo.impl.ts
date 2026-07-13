import { IAccountingStandardRepo } from '../../../../domain/accounting/repos/accounting-standards.repo';
import { accountingStandardsInCore } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import accountingStandardMapper from '../../mappers/accounting/accounting-standard.mapper';

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
