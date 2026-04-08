import userEntity from '../../../domain/user/entities/user.entity';
import IUserRepo from '../../../domain/user/repos/user.repo';
import { ErrorUnauthorized } from '../../../shared/value-objects/error';
import eventValue from '../../../shared/value-objects/event.vo';
import IRequestContext from '../../contracts/app/request-context.contract';
import { IAuthRes } from '../../contracts/dto/auth.dto';
import IAuthService from '../../contracts/infra/auth-service.contract';
import IEventBus from '../../contracts/infra/event-bus.contract';

export default function verifyEmailAddressUseCase(
  authService: IAuthService,
  userRepo: IUserRepo,
  requestContext: IRequestContext,
  eventBus: IEventBus
) {
  return async (token: string): Promise<IAuthRes> => {
    const { correlationId } = requestContext.get();

    const decodedToken = authService.verifyAuthToken(token);

    if (!decodedToken) {
      throw new ErrorUnauthorized('Invalid or expired verification token');
    }

    const user = await userRepo.findById(decodedToken.id, { correlationId });

    if (!user) {
      throw new ErrorUnauthorized('Invalid or expired verification token');
    }

    const [updatedUser, events] = userEntity.verifyEmail(user);

    await userRepo.save(updatedUser, { correlationId });

    eventBus.publish(eventValue.enrichAll(events, { correlationId }));

    const authToken = await authService.generateAuthToken(updatedUser);
    const refreshToken = await authService.generateRefreshToken(updatedUser);

    return {
      authToken,
      refreshToken,
    };
  };
}
