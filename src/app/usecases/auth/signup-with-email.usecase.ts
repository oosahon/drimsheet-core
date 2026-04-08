import userEntity from '../../../domain/user/entities/user.entity';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/value-objects/email.vo';
import passwordValue from '../../../domain/user/value-objects/password.vo';
import {
  ErrorConflict,
  ErrorForbidden,
} from '../../../shared/value-objects/error';
import { IIndividualSignupReq } from '../../contracts/dto/auth.dto';
import IAuthService from '../../contracts/infra/auth-service.contract';
import IRequestContext from '../../contracts/app/request-context.contract';
import IEventBus from '../../contracts/infra/event-bus.contract';
import eventValue from '../../../shared/value-objects/event.vo';

export default function signupWithEmailUsecase(
  requestContext: IRequestContext,
  userRepo: IUserRepo,
  authService: IAuthService,
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

    const password = passwordValue.make(payload.password);
    const passwordHash = await authService.hashPassword(password);
    const userWithPassword = { ...user, password: passwordHash };

    await userRepo.save(userWithPassword, { correlationId });

    const enrichedUserEvents = userEvents.map((e) =>
      eventValue.enrich(e, { correlationId, idempotencyKey })
    );

    eventBus.publish(enrichedUserEvents);
  };
}
