import makeTransactionalEmailService from '@app/notification/services/transaction-email.service';

import messaging from '@infra/messaging';
import transactionalEmailTemplate from '@infra/templates/email/transactional-email-template.impl';

export const transactionalEmailService = makeTransactionalEmailService({
  transactionalEmailQueue: messaging.queues.transactionalEmail,
  transactionalEmailTemplate,
});
