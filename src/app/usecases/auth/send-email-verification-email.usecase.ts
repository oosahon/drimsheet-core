import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/value-objects/email.vo';
import { AppError } from '../../../shared/value-objects/error';
import IRequestContext from '../../contracts/app/request-context.contract';
import IAuthService from '../../contracts/infra/auth-service.contract';
import ILogger from '../../contracts/infra/logger.contract';
import ITransactionalEmailService from '../../contracts/infra/transactional-email-service.contract';

export default function sendEmailVerificationEmailUseCase(
  requestContext: IRequestContext,
  logger: ILogger,
  authService: IAuthService,
  userRepo: IUserRepo,
  transactionalEmailService: ITransactionalEmailService
) {
  return async (userEmail: string) => {
    const { correlationId } = requestContext.get();

    const user = await userRepo.findByEmail(emailValue.normalize(userEmail), {
      correlationId,
    });

    if (!user) {
      throw new AppError('User not found', { cause: { userEmail } });
    }

    if (user.emailVerified) {
      logger.info('User email is already verified', {
        userId: user.id,
        email: user.email,
      });
      return;
    }

    const verificationLink = authService.getSignupVerificationLink({
      id: user.id,
      email: user.email,
    });

    await transactionalEmailService.sendEmailVerification({
      user,
      verificationLink,
      correlationId,
    });
  };
}
