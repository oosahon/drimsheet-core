import passOnRepoTransaction from '@shared/helpers/passon-repo-transaction';

import IContractorRepo from '@domain/counterparty/repos/contractor.repo';

import { counterpartyContractorsInCore } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import contractorMapper from '@infra/persistence/repos/counterparty/mappers/contractor.mapper';

import contractorHistoryRepo from './contractor-history.repo.impl';

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
