import { z } from 'zod';
import userEntity from '../../../domain/user/entities/user.entity';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/value-objects/email.vo';
import passwordValue from '../../../domain/user/value-objects/password.vo';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import {
  ErrorConflict,
  ErrorForbidden,
} from '../../../shared/value-objects/error';
import eventValue from '../../../shared/value-objects/event.vo';
import IRequestContext from '../../contracts/app/request-context.contract';
import { IUserSignupReq } from '../../contracts/dto/auth.dto';
import IAuthService, {
  EAuthStrategy,
} from '../../contracts/infra/auth-service.contract';
import IEventBus from '../../contracts/infra/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../contracts/infra/repo.contract';
import IUserAuthRepo from '../../contracts/repos/user-auth.repo.contract';

const validationSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'First name is required' })
    .max(100, { message: 'First name must be at most 100 characters' }),
  lastName: z
    .string()
    .min(1, { message: 'Last name is required' })
    .max(100, { message: 'Last name must be at most 100 characters' }),
  email: z.email(),
  password: z
    .string({ message: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(100, { message: 'Password must be at most 50 characters' })
    .regex(/(?=.*[0-9])/, {
      message: 'Password must contain at least one number',
    })
    .regex(/(?=.*[^A-Za-z0-9])/, {
      message: 'Password must contain at least one special character',
    }),
});

export default function makeSignupWithEmailUsecase(
  requestContext: IRequestContext,
  userRepo: IUserRepo,
  makeAuthService: IAuthService,
  eventBus: IEventBus,
  userAuthRepo: IUserAuthRepo,
  repoService: IRepoService
) {
  return async (payload: IUserSignupReq) => {
    zodValidationRunner(validationSchema, payload);

    const { correlationId, idempotencyKey } = requestContext.get();

    const email = emailValue.make(payload.email);

    const isPermittedEmail = makeAuthService.isPermittedEmail(email);

    if (!isPermittedEmail) {
      throw new ErrorForbidden('Email is not permitted');
    }

    const existingUser = await userRepo.findByEmail(email, {
      correlationId,
    });

    if (existingUser) {
      throw new ErrorConflict('An account with this email already exists');
    }

    const password = passwordValue.make(payload.password);
    const passwordHash = await makeAuthService.hashPassword(password);

    const [user, userEvents] = userEntity.make({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email,
      emailVerified: false,
    });

    const repoTransaction: TRepoTransactionFn = async (tx) => {
      await userRepo.save(user, { correlationId, tx });
      const timestamp = new Date();

      await userAuthRepo.save(
        {
          userId: user.id,
          password: passwordHash,
          failedLoginAttempts: 0,
          strategy: [EAuthStrategy.Email],
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        { correlationId, tx }
      );
    };

    await repoService.runInTransaction(repoTransaction);

    const enrichedUserEvents = userEvents.map((e) =>
      eventValue.enrich(e, { correlationId, idempotencyKey })
    );

    eventBus.publish(enrichedUserEvents);
  };
}
