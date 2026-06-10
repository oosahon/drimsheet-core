import ITransactionalEmailService from '../../app/notification/contracts/transactional-email-service.contract';
import IQueue from '../../app/shared/contracts/queues.contract';
import emailVerificationEmail from '../templates/email-verification-email';
import passwordResetRequestEmail from '../templates/password-reset-request-email';

export default function makeTransactionalEmailService(
  queue: IQueue
): ITransactionalEmailService {
  return {
    async sendEmailVerification(payload) {
      const { correlationId, user, verificationLink } = payload;

      queue.addTransactionalEmail({
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

      queue.addTransactionalEmail({
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
