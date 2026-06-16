import z from 'zod';
import userEntity from '../../../domain/user/entities/user.entity';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/value-objects/email.vo';
import passwordValue from '../../../domain/user/value-objects/password.vo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import IRequestContext from '../../../shared/contracts/request-context.contract';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import historyValue from '../../../shared/value-objects/history.vo';
import IUserAuthRepo from '../../auth/contracts/user-auth.repo.contract';
import { IUserSignupReq } from '../../auth/dtos/auth.dto';
import appError from '../../shared/errors/app.error';
import IAuthService, {
  EAuthStrategy,
} from '../contracts/auth-service.contract';

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
      throw new appError.Forbidden();
    }

    const existingUser = await userRepo.findByEmail(email, {
      correlationId,
    });

    if (existingUser) {
      throw new appError.Conflict();
    }

    const password = passwordValue.make(payload.password);
    const passwordHash = await makeAuthService.hashPassword(password);

    const [user, userEvents, userAudit] = userEntity.make({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email,
      emailVerified: false,
    });

    const history = historyValue.make(
      userAudit,
      historyValue.getUserActor(user.id),
      correlationId
    );

    const repoTransaction: TRepoTransactionFn = async (tx) => {
      await userRepo.create(user, { correlationId, tx, history });
      const timestamp = new Date();

      await userAuthRepo.create(
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
