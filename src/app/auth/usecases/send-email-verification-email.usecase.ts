import { z } from 'zod';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/value-objects/email.vo';
import { WEB_APP_URL } from '../../../infra/config/vars.config';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import authError from '../../auth/errors/auth.error';
import IAuthService from '../../shared/contracts/auth-service.contract';
import ILogger from '../../shared/contracts/logger.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import ITransactionalEmailService from '../../shared/contracts/transactional-email-service.contract';

const validationSchema = z.object({
  email: z.email(),
});

export default function makeSendEmailVerificationEmailUseCase(
  requestContext: IRequestContext,
  logger: ILogger,
  makeAuthService: IAuthService,
  userRepo: IUserRepo,
  transactionalEmailService: ITransactionalEmailService
) {
  return async (userEmail: string) => {
    zodValidationRunner(validationSchema, { email: userEmail });

    const { correlationId } = requestContext.get();

    const user = await userRepo.findByEmail(emailValue.normalize(userEmail), {
      correlationId,
    });

    if (!user) {
      throw new authError.UserNotFound();
    }

    if (user.emailVerified) {
      logger.info(
        'Skipping sending email verification email as user email is already verified',
        {
          userId: user.id,
          email: user.email,
        }
      );
      return;
    }

    const verificationToken = await makeAuthService.generateSignupToken({
      id: user.id,
    });

    const verificationLink = `${WEB_APP_URL}/auth/signup/complete?token=${verificationToken}`;

    await transactionalEmailService.sendEmailVerification({
      user,
      verificationLink,
      correlationId,
    });
  };
}
