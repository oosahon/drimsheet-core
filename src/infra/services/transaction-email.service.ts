import ITransactionalEmailService from '../../app/contracts/infra/transactional-email-service.contract';
import queue from '../messaging/jobs/queues';
import emailVerificationEmail from '../templates/email-verification-email';

const transactionalEmailService: ITransactionalEmailService = {
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
};

export default transactionalEmailService;
