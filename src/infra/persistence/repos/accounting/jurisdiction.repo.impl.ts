import IJurisdictionRepo from '../../../../domain/accounting/repos/jurisdiction.repo';
import getDbQuery from '../../../../shared/helpers/get-db-query';
import { jurisdictionsInCore } from '../../../config/drizzle/schema';
import jurisdictionMapper from '../../mappers/accounting/jurisdiction.mapper';

const jurisdictionRepo: IJurisdictionRepo = {
  create: async (domain, options) => {
    const query = getDbQuery(options);

    const values = Array.isArray(domain)
      ? domain.map(jurisdictionMapper.toRepo)
      : [jurisdictionMapper.toRepo(domain)];

    if (values.length === 0) return;

    await query
      .insert(jurisdictionsInCore)
      .values(values)
      .onConflictDoNothing();
  },
};

export default jurisdictionRepo;
