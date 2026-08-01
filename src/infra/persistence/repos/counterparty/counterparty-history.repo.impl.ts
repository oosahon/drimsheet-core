import ICounterpartyHistoryRepo from '../../../../domain/counterparty/repos/counterparty-history.repo';
import { counterpartyHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import counterpartyHistoryMapper from './mappers/counterparty-history.mapper';

const counterpartyHistoryRepo: ICounterpartyHistoryRepo = {
  save: async (counterparty, history, options) => {
    await getDbQuery(options)
      .insert(counterpartyHistoryInAudit)
      .values(counterpartyHistoryMapper.toRepo(counterparty, history));
  },
};

export default counterpartyHistoryRepo;
