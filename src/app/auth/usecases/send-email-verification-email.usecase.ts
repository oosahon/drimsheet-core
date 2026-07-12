import { z } from 'zod';
import IUserRepo from '../../../domain/user/repos/user.repo';
import emailValue from '../../../domain/user/value-objects/email.vo';
import ILogger from '../../../shared/contracts/logger.contract';
import IVarsConfig from '../../../shared/contracts/vars-config.contract';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import ITransactionalEmailService from '../../notification/contracts/transactional-email-service.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import IAuthService from '../contracts/auth-service.contract';
import authError from '../errors/auth.error';

const validationSchema = z.object({
  email: z.email(),
});

interface IDependencies {
  requestContext: IRequestContext;
  logger: ILogger;
  makeAuthService: IAuthService;
  userRepo: IUserRepo;
  transactionalEmailService: ITransactionalEmailService;
  varsConfig: IVarsConfig;
}

export default function makeSendEmailVerificationEmailUseCase(
  deps: IDependencies
) {
  return async (userEmail: string) => {
    zodValidationRunner(validationSchema, { email: userEmail });

    const { correlationId } = deps.requestContext.get();

    const user = await deps.userRepo.findByEmail(
      emailValue.normalize(userEmail),
      {
        correlationId,
      }
    );

    if (!user) {
      throw new authError.UserNotFound();
    }

    if (user.emailVerified) {
      deps.logger.info(
        'Skipping sending email verification email as user email is already verified',
        {
          userId: user.id,
          email: user.email,
        }
      );
      return;
    }

    const verificationToken = await deps.makeAuthService.generateSignupToken({
      id: user.id,
    });

    const verificationLink = `${deps.varsConfig.WEB_APP_URL}/auth/signup/complete?token=${verificationToken}`;

    await deps.transactionalEmailService.sendEmailVerification({
      user,
      verificationLink,
      correlationId,
    });
  };
}
