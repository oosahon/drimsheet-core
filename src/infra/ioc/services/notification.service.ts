import makeTransactionalEmailService from '../../../app/notification/services/transaction-email.service';
import messaging from '../../messaging';

const transactionalEmail = makeTransactionalEmailService({
  transactionalEmailQueue: messaging.queues.transactionalEmail,
});

const notificationService = Object.freeze({
  transactionalEmail,
});

export default notificationService;
