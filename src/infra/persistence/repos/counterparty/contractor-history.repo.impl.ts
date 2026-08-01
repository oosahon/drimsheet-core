import IContractorHistoryRepo from '../../../../domain/counterparty/repos/contractor-history.repo';
import { counterpartyContractorHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import contractorHistoryMapper from './mappers/contractor-history.mapper';

const contractorHistoryRepo: IContractorHistoryRepo = {
  save: async (history, options) => {
    await getDbQuery(options)
      .insert(counterpartyContractorHistoryInAudit)
      .values(contractorHistoryMapper.toRepo(history));
  },
};

export default contractorHistoryRepo;
