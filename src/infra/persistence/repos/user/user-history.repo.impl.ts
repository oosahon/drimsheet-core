import IUserHistoryRepo from '@domain/user/repos/user-history.repo';

import { userProfileHistoryInAudit } from '@infra/config/drizzle/schema';
import getDbQuery from '@infra/persistence/helpers/get-db-query';
import userHistoryMapper from '@infra/persistence/repos/user/mappers/user-history.mapper';

const userHistoryRepo: IUserHistoryRepo = {
  save: async (history, options) => {
    await getDbQuery(options)
      .insert(userProfileHistoryInAudit)
      .values(userHistoryMapper.toRepo(history));
  },
};

export default userHistoryRepo;
