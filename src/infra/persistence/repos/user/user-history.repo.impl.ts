import IUserHistoryRepo from '../../../../domain/user/repos/user-history.repo';
import getDbQuery from '../../../../shared/helpers/get-db-query';
import { userProfileHistoryInAudit } from '../../../config/drizzle/schema';
import userHistoryMapper from '../../mappers/user/user-history.mapper';

const userHistoryRepo: IUserHistoryRepo = {
  save: async (history, options) => {
    await getDbQuery(options)
      .insert(userProfileHistoryInAudit)
      .values(userHistoryMapper.toRepo(history));
  },
};

export default userHistoryRepo;
