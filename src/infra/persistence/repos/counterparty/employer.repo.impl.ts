import passOnRepoTransaction from '@shared/helpers/passon-repo-transaction';

import IEmployerRepo from '@domain/counterparty/repos/employer.repo';

import { counterpartyEmployersInCore } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import employerMapper from '@infra/persistence/repos/counterparty/mappers/employer.mapper';

import employerHistoryRepo from './employer-history.repo.impl';

const employerRepo: IEmployerRepo = {
  create: async (payload, options) => {
    await getDbQuery(options).transaction(async (tx) => {
      await tx
        .insert(counterpartyEmployersInCore)
        .values(employerMapper.toRepo(payload));

      await employerHistoryRepo.save(
        options.history,
        passOnRepoTransaction(options, tx)
      );
    });
  },
};

export default employerRepo;
