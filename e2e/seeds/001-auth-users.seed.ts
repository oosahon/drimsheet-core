import {
  IUserAuth,
  UAuthStrategy,
} from '../../src/app/contracts/infra/auth-service.contract';
import userEntity from '../../src/domain/user/entities/user.entity';
import repos from '../../src/infra/persistence/repos';
import services from '../../src/infra/services';
import {
  USER_ACCOUNT_EXISTING,
  USER_ACCOUNT_GOOGLE_STRATEGY,
  USER_ACCOUNT_UN_ONBOARDED,
  USER_FIRST_NAME,
  USER_LAST_NAME,
  USER_PASSWORD,
} from '../config/var.seed';

const [existingUser] = userEntity.make({
  firstName: USER_FIRST_NAME,
  lastName: USER_LAST_NAME,
  email: USER_ACCOUNT_EXISTING,
  emailVerified: true,
});

const [unOnboardedUser] = userEntity.make({
  firstName: USER_FIRST_NAME,
  lastName: USER_LAST_NAME,
  email: USER_ACCOUNT_UN_ONBOARDED,
  emailVerified: true,
});

const [googleStrategyUser] = userEntity.make({
  firstName: USER_FIRST_NAME,
  lastName: USER_LAST_NAME,
  email: USER_ACCOUNT_GOOGLE_STRATEGY,
  emailVerified: true,
});

export default async function seed() {
  const correlationId = '001-existing-user';

  const password = await services.auth.hashPassword(USER_PASSWORD);

  await services.repo.runInTransaction(async (tx) => {
    try {
      const options = { tx, correlationId };

      for (const user of [existingUser, unOnboardedUser, googleStrategyUser]) {
        await repos.user.save(user, options);
        const strategy: UAuthStrategy[] =
          user.email === USER_ACCOUNT_GOOGLE_STRATEGY ? ['google'] : ['email'];

        const userAuth: IUserAuth = {
          userId: user.id,
          password,
          failedLoginAttempts: 0,
          strategy,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
        await repos.userAuth.save(userAuth, options);
      }
    } catch (error) {
      console.error('Error seeding existing user:', error);
    }
  });
}

export { existingUser };
