import { z } from 'zod';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/value-objects/email.vo';
import { WEB_APP_URL } from '../../../infra/config/vars.config';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import IRequestContext from '../../contracts/app/request-context.contract';
import IAuthService from '../../contracts/infra/auth-service.contract';
import ILogger from '../../contracts/infra/logger.contract';
import ITransactionalEmailService from '../../contracts/infra/transactional-email-service.contract';
import authError from '../../errors/auth.error';

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
