import IJurisdictionRepo from '../../../../domain/accounting/repos/jurisdiction.repo';
import { jurisdictionsInCore } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import jurisdictionMapper from './mappers/jurisdiction.mapper';

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
