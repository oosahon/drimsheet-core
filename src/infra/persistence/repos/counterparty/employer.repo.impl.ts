import IEmployerRepo from '../../../../domain/counterparty/repos/employer.repo';
import passOnRepoTransaction from '../../../../shared/helpers/passon-repo-transaction';
import { counterpartyEmployersInCore } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import employerHistoryRepo from './employer-history.repo.impl';
import employerMapper from './mappers/employer.mapper';

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
