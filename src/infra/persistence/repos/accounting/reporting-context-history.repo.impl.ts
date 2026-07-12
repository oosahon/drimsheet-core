import IReportingContextHistoryRepo from '../../../../domain/accounting/repos/reporting-context-history.repo';
import { reportingContextHistoryInAudit } from '../../../config/drizzle/schema';
import reportingContextHistoryMapper from '../../mappers/accounting/reporting-context-history.mapper';
import getDbQuery from '../helpers/query';

const reportingContextHistoryRepo: IReportingContextHistoryRepo = {
  save: async (context, history, options) => {
    await getDbQuery(options)
      .insert(reportingContextHistoryInAudit)
      .values(reportingContextHistoryMapper.toRepo(context, history));
  },
};

export default reportingContextHistoryRepo;
