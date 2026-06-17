import userHistoryMapper from '../../../../app/user/mappers/user-history.mapper';
import IUserHistoryRepo from '../../../../domain/user/repos/user-history.repo';
import { userProfileHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../helpers/query';

const userHistoryRepo: IUserHistoryRepo = {
  save: async (history, options) => {
    await getDbQuery(options)
      .insert(userProfileHistoryInAudit)
      .values(userHistoryMapper.toRepo(history));
  },
};

export default userHistoryRepo;
