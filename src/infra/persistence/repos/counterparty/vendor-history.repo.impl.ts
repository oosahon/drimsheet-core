import IVendorHistoryRepo from '../../../../domain/counterparty/repos/vendor-history.repo';
import { counterpartyVendorHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import vendorHistoryMapper from './mappers/vendor-history.mapper';

const vendorHistoryRepo: IVendorHistoryRepo = {
  save: async (history, options) => {
    await getDbQuery(options)
      .insert(counterpartyVendorHistoryInAudit)
      .values(vendorHistoryMapper.toRepo(history));
  },
};

export default vendorHistoryRepo;
