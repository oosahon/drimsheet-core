import { IUserAuth } from '../../src/app/contracts/infra/auth-service.contract';
import userEntity from '../../src/domain/user/entities/user.entity';
import repos from '../../src/infra/persistence/repos';
import services from '../../src/infra/services';
import {
  USER_ACCOUNT_EXISTING,
  USER_FIRST_NAME,
  USER_LAST_NAME,
  USER_PASSWORD,
} from '../config/var.seed';

export default async function seed() {
  const correlationId = '001-existing-user';

  const [existingUser] = userEntity.make({
    firstName: USER_FIRST_NAME,
    lastName: USER_LAST_NAME,
    email: USER_ACCOUNT_EXISTING,
    emailVerified: true,
  });

  const password = await services.auth.hashPassword(USER_PASSWORD);

  const userAuth: IUserAuth = {
    userId: existingUser.id,
    password,
    failedLoginAttempts: 0,
    strategy: ['email'],
    createdAt: existingUser.createdAt,
    updatedAt: existingUser.updatedAt,
  };

  await services.repo.runInTransaction(async (tx) => {
    try {
      const options = { tx, correlationId };

      await repos.user.save(existingUser, options);
      await repos.userAuth.save(userAuth, options);
    } catch (error) {
      console.error('Error seeding existing user:', error);
    }
  });
}
