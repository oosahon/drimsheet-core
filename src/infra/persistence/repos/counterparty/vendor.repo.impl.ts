import IVendorRepo from '../../../../domain/counterparty/repos/vendor.repo';
import passOnRepoTransaction from '../../../../shared/helpers/passon-repo-transaction';
import { counterpartyVendorsInCore } from '../../../config/drizzle/schema';

import getDbQuery from '../../helpers/get-db-query';
import vendorMapper from './mappers/vendor.mapper';
import vendorHistoryRepo from './vendor-history.repo.impl';

const vendorRepo: IVendorRepo = {
  create: async (payload, options) => {
    await getDbQuery(options).transaction(async (tx) => {
      await tx
        .insert(counterpartyVendorsInCore)
        .values(vendorMapper.toRepo(payload));

      await vendorHistoryRepo.save(
        options.history,
        passOnRepoTransaction(options, tx)
      );
    });
  },
};

export default vendorRepo;
