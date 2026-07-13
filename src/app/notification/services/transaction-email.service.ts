import ITransactionalEmailQueue from '../contracts/transactional-email-queue.contract';
import ITransactionalEmailService from '../contracts/transactional-email-service.contract';
import emailVerificationEmail from '../templates/email-verification-email';
import passwordResetRequestEmail from '../templates/password-reset-request-email';

interface IDependencies {
  transactionalEmailQueue: ITransactionalEmailQueue;
}

export default function makeTransactionalEmailService(
  deps: IDependencies
): ITransactionalEmailService {
  return {
    async sendEmailVerification(payload) {
      const { correlationId, user, verificationLink } = payload;

      deps.transactionalEmailQueue.add({
        emails: [user.email],
        subject: 'Action Required: Verify Your Email Address',
        html: emailVerificationEmail({
          firstName: user.firstName,
          verificationLink,
        }),
        correlationId,
      });
    },

    async sendPasswordResetLink(payload) {
      const { correlationId, user, resetLink } = payload;

      deps.transactionalEmailQueue.add({
        emails: [user.email],
        subject: 'Reset your password',
        html: passwordResetRequestEmail({
          subject: 'Password Reset Request',
          firstName: user.firstName,
          passwordResetLink: resetLink,
        }),
        correlationId,
      });
    },
  };
}
