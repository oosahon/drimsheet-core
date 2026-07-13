import IUserHistoryRepo from '../../../../domain/user/repos/user-history.repo';
import { userProfileHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import userHistoryMapper from '../../mappers/user/user-history.mapper';

const userHistoryRepo: IUserHistoryRepo = {
  save: async (history, options) => {
    await getDbQuery(options)
      .insert(userProfileHistoryInAudit)
      .values(userHistoryMapper.toRepo(history));
  },
};

export default userHistoryRepo;
