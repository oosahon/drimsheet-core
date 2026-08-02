import makeTransactionalEmailService from '../../../app/notification/services/transaction-email.service';
import messaging from '../../messaging';

export const transactionalEmailService = makeTransactionalEmailService({
  transactionalEmailQueue: messaging.queues.transactionalEmail,
});
