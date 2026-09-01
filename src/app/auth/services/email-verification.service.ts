import { ICacheStorage } from '@shared/contracts/cache-storage.contract';
import IVarsConfig from '@shared/contracts/vars-config.contract';

import IEmailVerificationService from '@app/auth/contracts/email-verification-service.contract';
import ITokenService from '@app/auth/contracts/token-service.contract';
import ITransactionalEmailService from '@app/notification/contracts/transactional-email-service.contract';

export const EMAIL_VERIFICATION_COOL_DOWN_SECONDS = 60;

interface IDependencies {
  cacheStorage: ICacheStorage;
  tokenService: ITokenService;
  transactionalEmailService: ITransactionalEmailService;
  varsConfig: IVarsConfig;
}

function getCoolDownKey(userId: string): string {
  return `app:auth:email-verification-cooldown:${userId}`;
}

/**
 * Creates the capability that acquires the verification cooldown and sends
 * the email, releasing the cooldown when token generation or delivery fails.
 */
function makeSend(deps: IDependencies): IEmailVerificationService['send'] {
  return async (user, correlationId) => {
    const coolDownKey = getCoolDownKey(user.id);
    const acquired = await deps.cacheStorage.setIfNotExists(
      coolDownKey,
      true,
      EMAIL_VERIFICATION_COOL_DOWN_SECONDS
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
      await deps.cacheStorage.del(coolDownKey);
      throw error;
    }
  };
}

/** Composes the immutable email-verification service from its capability. */
export default function makeEmailVerificationService(deps: IDependencies) {
  const service: IEmailVerificationService = {
    send: makeSend(deps),
  };

  return Object.freeze(service);
}
