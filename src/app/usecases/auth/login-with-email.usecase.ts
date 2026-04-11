import z from 'zod';
import userEvents from '../../../domain/user/events/user.events';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/value-objects/email.vo';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import { ErrorBadRequest } from '../../../shared/value-objects/error';
import IRequestContext from '../../contracts/app/request-context.contract';
import { IAuthRes, ILoginReq } from '../../contracts/dto/auth.dto';
import IAuthService from '../../contracts/infra/auth-service.contract';
import IEventBus from '../../contracts/infra/event-bus.contract';

const validationSchema = z.object({
  email: z.email({ message: 'Email is required' }),
  password: z
    .string({ message: 'Password is required' })
    .max(100, { message: 'Password must be at most 100 characters' }),
});

export default function loginWithEmailUseCase(
  reqContext: IRequestContext,
  userRepo: IUserRepo,
  authService: IAuthService,
  eventBus: IEventBus
) {
  return async (payload: ILoginReq): Promise<IAuthRes> => {
    zodValidationRunner(validationSchema, payload);

    const { correlationId } = reqContext.get();

    const { password } = payload;

    const email = emailValue.normalize(payload.email);

    const user = await userRepo.findByEmail(email, { correlationId });

    if (!user || !password || !user.password) {
      throw new ErrorBadRequest('Invalid email or password');
    }

    const isValidPassword = await authService.comparePassword(
      password,
      user.password
    );

    if (!isValidPassword) {
      throw new ErrorBadRequest('Invalid email or password');
    }

    const authToken = await authService.generateAuthToken(user);
    const refreshToken = await authService.generateRefreshToken(user);

    eventBus.publish(userEvents.loggedIn(user));

    return { authToken: authToken, refreshToken };
  };
}
