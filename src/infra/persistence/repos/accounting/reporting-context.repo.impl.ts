import IReportingContextRepo from '../../../../domain/accounting/repos/reporting-context.repo';
import { reportingContextsInCore } from '../../../config/drizzle/schema';
import reportingContextMapper from '../../mappers/accounting/reporting-context.mapper';
import passOnRepoTransaction from '../helpers/passon-repo-transaction';
import getDbQuery from '../helpers/query';
import reportingContextHistoryRepo from './reporting-context-history.repo.impl';

const reportingContextRepoImpl: IReportingContextRepo = {
  create: async (payload, options) => {
    await getDbQuery(options).transaction(async (tx) => {
      await tx
        .insert(reportingContextsInCore)
        .values(reportingContextMapper.toRepo(payload));

      await reportingContextHistoryRepo.save(
        payload,
        options.history,
        passOnRepoTransaction(options, tx)
      );
    });
  },
};

export default reportingContextRepoImpl;
