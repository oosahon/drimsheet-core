import ICounterpartyRepo from '../../../../domain/counterparty/repos/counterparty.repo';
import passOnRepoTransaction from '../../../../shared/helpers/passon-repo-transaction';
import {
  counterpartiesInCore,
  counterpartyRolesInCore,
} from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import counterpartyHistoryRepo from './counterparty-history.repo.impl';
import counterpartyRoleMapper from './mappers/counterparty-role.mapper';
import counterpartyMapper from './mappers/counterparty.mapper';

const counterpartyRepo: ICounterpartyRepo = {
  create: async (payload, options) => {
    await getDbQuery(options).transaction(async (tx) => {
      await tx
        .insert(counterpartiesInCore)
        .values(counterpartyMapper.toRepo(payload));

      await counterpartyHistoryRepo.save(
        payload,
        options.history,
        passOnRepoTransaction(options, tx)
      );

      if (payload.roles?.length) {
        await tx
          .insert(counterpartyRolesInCore)
          .values(counterpartyRoleMapper.toRepoMany(payload.id, payload.roles));
      }
    });
  },
};

export default counterpartyRepo;
