import IEmployerHistoryRepo from '../../../../domain/counterparty/repos/employer-history.repo';
import { counterpartyEmployerHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import employerHistoryMapper from './mappers/employer-history.mapper';

const employerHistoryRepo: IEmployerHistoryRepo = {
  save: async (history, options) => {
    await getDbQuery(options)
      .insert(counterpartyEmployerHistoryInAudit)
      .values(employerHistoryMapper.toRepo(history));
  },
};

export default employerHistoryRepo;
