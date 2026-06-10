import accountingStandardMapper from '../../../../app/accounting/mappers/accounting-standard.mapper';
import { IAccountingStandardRepo } from '../../../../domain/accounting/repos/accounting-standards.repo';
import { accountingStandardsInCore } from '../../../config/drizzle/schema';
import getDbQuery from '../helpers/query';

const accountingStandardRepo: IAccountingStandardRepo = {
  save: async (domain, options) => {
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
