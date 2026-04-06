import accountingEntityTypeEntity from '../../../domain/accounting/entities/accounting-entity.entity';
import IAccountingEntityRepo from '../../../domain/accounting/repos/accounting-entity.repo';
import { EAccountingEntityType } from '../../../domain/accounting/types/accounting.types';
import userEntity from '../../../domain/user/entities/user.entity';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/value-objects/email.vo';
import passwordValue from '../../../domain/user/value-objects/password.vo';
import {
  ErrorConflict,
  ErrorForbidden,
} from '../../../shared/value-objects/error';
import { NAIRA } from '../../bootstrap/data/currencies';
import { IIndividualSignupReq } from '../../contracts/dto/auth.dto';
import IAuthService from '../../contracts/infra/auth-service.contract';
import { IRepoService } from '../../contracts/infra/repo.contract';
import IRequestContext from '../../contracts/app/request-context.contract';
import IEventBus from '../../contracts/infra/event-bus.contract';

export default function signupWithEmailUsecase(
  repoService: IRepoService,
  requestContext: IRequestContext,
  userRepo: IUserRepo,
  authService: IAuthService,
  accountingEntityRepo: IAccountingEntityRepo,
  eventBus: IEventBus
) {
  return async (payload: IIndividualSignupReq) => {
    const { correlationId, idempotencyKey } = requestContext.get();

    const email = emailValue.make(payload.email);

    const isPermittedEmail = authService.isPermittedEmail(email);

    if (!isPermittedEmail) {
      throw new ErrorForbidden('Email is not permitted');
    }

    const existingUser = await userRepo.findByEmail(email, {
      correlationId,
    });

    if (existingUser) {
      throw new ErrorConflict('User already exists');
    }

    const [user, userEvents] = userEntity.make({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email,
      emailVerified: false,
    });

    const [individualDomain, individualEntityEvents] =
      accountingEntityTypeEntity.make({
        ownerId: user.id,
        functionalCurrency: NAIRA,
        reportingCurrency: payload.reportingCurrency,
        type: EAccountingEntityType.Individual,
        fiscalYearStart: { month: 12, day: 31 },
      });

    const password = passwordValue.make(payload.password);
    const passwordHash = await authService.hashPassword(password);
    const userWithPassword = { ...user, password: passwordHash };

    await repoService.runInTransaction(async (tx) => {
      const repoOptions = { tx, correlationId };
      await userRepo.save(userWithPassword, repoOptions);
      await accountingEntityRepo.save(individualDomain, repoOptions);
    });

    [...userEvents, ...individualEntityEvents].forEach(({ enricher }) => {
      const event = enricher({ correlationId, idempotencyKey });
      eventBus.publish(event);
    });
  };
}
