import { ICacheStorage } from '../../../shared/contracts/cache-storage.contract';
import IVarsConfig from '../../../shared/contracts/vars-config.contract';
import ITransactionalEmailService from '../../notification/contracts/transactional-email-service.contract';
import IEmailVerificationService from '../contracts/email-verification-service.contract';
import ITokenService from '../contracts/token-service.contract';

export const EMAIL_VERIFICATION_COOLDOWN_SECONDS = 60;

interface IDependencies {
  cacheStorage: ICacheStorage;
  tokenService: ITokenService;
  transactionalEmailService: ITransactionalEmailService;
  varsConfig: IVarsConfig;
}

function getCooldownKey(userId: string): string {
  return `app:auth:email-verification-cooldown:${userId}`;
}

export default function makeEmailVerificationService(
  deps: IDependencies
): IEmailVerificationService {
  return {
    async send(user, correlationId) {
      const cooldownKey = getCooldownKey(user.id);
      const acquired = await deps.cacheStorage.setIfNotExists(
        cooldownKey,
        true,
        EMAIL_VERIFICATION_COOLDOWN_SECONDS
      );

      if (!acquired) return false;

      try {
        const verificationToken = await deps.tokenService.generateSignupToken({
          id: user.id,
        });
        const verificationLink = `${deps.varsConfig.WEB_APP_URL}/auth/signup/complete?token=${verificationToken}`;

        await deps.transactionalEmailService.sendEmailVerification({
          user,
          verificationLink,
          correlationId,
        });

        return true;
      } catch (error) {
        await deps.cacheStorage.del(cooldownKey);
        throw error;
      }
    },
  };
}
