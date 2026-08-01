import IContractorRepo from '../../../../domain/counterparty/repos/contractor.repo';
import passOnRepoTransaction from '../../../../shared/helpers/passon-repo-transaction';
import { counterpartyContractorsInCore } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import contractorHistoryRepo from './contractor-history.repo.impl';
import contractorMapper from './mappers/contractor.mapper';

const contractorRepo: IContractorRepo = {
  create: async (payload, options) => {
    await getDbQuery(options).transaction(async (tx) => {
      await tx
        .insert(counterpartyContractorsInCore)
        .values(contractorMapper.toRepo(payload));

      await contractorHistoryRepo.save(
        options.history,
        passOnRepoTransaction(options, tx)
      );
    });
  },
};

export default contractorRepo;
