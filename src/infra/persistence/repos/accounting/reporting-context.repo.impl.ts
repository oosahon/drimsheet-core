import IReportingContextRepo from '../../../../domain/accounting/repos/reporting-context.repo';
import passOnRepoTransaction from '../../../../shared/helpers/passon-repo-transaction';
import { reportingContextsInCore } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import reportingContextMapper from './mappers/reporting-context.mapper';
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
