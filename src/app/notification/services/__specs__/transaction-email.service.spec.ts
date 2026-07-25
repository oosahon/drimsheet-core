import ITransactionalEmailQueue from '../../contracts/transactional-email-queue.contract';
import makeTransactionalEmailService from '../transaction-email.service';

describe('transactionEmailService', () => {
  let mockQueue: jest.Mocked<ITransactionalEmailQueue>;
  let service: ReturnType<typeof makeTransactionalEmailService>;

  beforeEach(() => {
    mockQueue = {
      add: jest.fn(),
    } as any;

    service = makeTransactionalEmailService({
      transactionalEmailQueue: mockQueue,
    });
  });

  describe('sendEmailVerification', () => {
    it('adds verification email to the queue', async () => {
      const payload = {
        correlationId: 'corr-id-1',
        user: {
          email: 'alice@example.com',
          firstName: 'Alice',
        } as any,
        verificationLink: 'https://example.com/verify',
      };

      await service.sendEmailVerification(payload);

      expect(mockQueue.add).toHaveBeenCalledTimes(1);
      expect(mockQueue.add).toHaveBeenCalledWith({
        emails: ['alice@example.com'],
        subject: 'Action Required: Verify Your Email Address',
        html: expect.stringContaining('Hi, Alice'),
        correlationId: 'corr-id-1',
      });
    });
  });

  describe('sendPasswordResetLink', () => {
    it('adds password reset email to the queue and escapes user first name', async () => {
      const payload = {
        correlationId: 'corr-id-2',
        user: {
          email: 'bob@example.com',
          firstName: '<Bob>&"\'',
        } as any,
        resetLink: 'https://example.com/reset',
      };

      await service.sendPasswordResetLink(payload);

      expect(mockQueue.add).toHaveBeenCalledTimes(1);
      expect(mockQueue.add).toHaveBeenCalledWith({
        emails: ['bob@example.com'],
        subject: 'Reset your password',
        html: expect.stringContaining('&lt;Bob&gt;&amp;&quot;&#39;'),
        correlationId: 'corr-id-2',
      });
    });
  });
});
