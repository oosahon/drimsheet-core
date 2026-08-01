import IReportingContextHistoryRepo from '../../../../domain/accounting/repos/reporting-context-history.repo';
import { reportingContextHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import reportingContextHistoryMapper from './mappers/reporting-context-history.mapper';

const reportingContextHistoryRepo: IReportingContextHistoryRepo = {
  save: async (context, history, options) => {
    await getDbQuery(options)
      .insert(reportingContextHistoryInAudit)
      .values(reportingContextHistoryMapper.toRepo(context, history));
  },
};

export default reportingContextHistoryRepo;
