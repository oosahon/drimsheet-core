import { z } from 'zod';
import userEntity from '../../../domain/user/entities/user.entity';
import IUserRepo from '../../../domain/user/repos/user.repo';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import { ErrorBadRequest } from '../../../shared/value-objects/error';
import eventValue from '../../../shared/value-objects/event.vo';
import IRequestContext from '../../contracts/app/request-context.contract';
import { IResetPasswordReq } from '../../contracts/dto/auth.dto';
import IAuthService from '../../contracts/infra/auth-service.contract';
import IEventBus from '../../contracts/infra/event-bus.contract';

const validationSchema = z
  .object({
    token: z
      .string({ message: 'Token is required' })
      .min(1, 'Token is required'),
    password: z
      .string({ message: 'Password is required' })
      .min(8, { message: 'Password must be at least 8 characters' })
      .max(100, { message: 'Password must be at most 100 characters' })
      .regex(/(?=.*[0-9])/, {
        message: 'Password must contain at least one number',
      })
      .regex(/(?=.*[^A-Za-z0-9])/, {
        message: 'Password must contain at least one special character',
      }),
    confirmPassword: z.string({ message: 'Confirm password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function resetPasswordUseCase(
  requestContext: IRequestContext,
  userRepo: IUserRepo,
  authService: IAuthService,
  eventBus: IEventBus
) {
  return async (payload: IResetPasswordReq) => {
    zodValidationRunner(validationSchema, payload);

    const { correlationId, idempotencyKey } = requestContext.get();

    const tokenPayload = await authService.verifyPasswordResetToken(
      payload.token
    );

    if (!tokenPayload) {
      throw new ErrorBadRequest('Invalid or expired password reset token');
    }

    const existingUser = await userRepo.findById(tokenPayload.id, {
      correlationId,
    });

    if (!existingUser) {
      throw new ErrorBadRequest('Invalid or expired password reset token');
    }

    const passwordHash = await authService.hashPassword(payload.password);

    const [updatedUser, userEvents] = userEntity.updatePassword(
      existingUser,
      passwordHash
    );

    await userRepo.save(updatedUser, { correlationId });

    const enrichedUserEvents = userEvents.map((e) =>
      eventValue.enrich(e, { correlationId, idempotencyKey })
    );

    eventBus.publish(enrichedUserEvents);
  };
}
