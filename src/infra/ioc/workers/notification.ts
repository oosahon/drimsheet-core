import makeTransactionalEmailWorker from '../../../app/notification/workers/transactional-email.worker';
import internalMailer from '../../config/internal-mailer.config';
import { NODE_ENV } from '../../config/vars.config';
import zeptoMail from '../../config/zeptomail.config';
import observability from '../../observability';

const mailer = NODE_ENV === 'test' ? internalMailer : zeptoMail.notifications;

export const transactionalEmailWorker = makeTransactionalEmailWorker({
  mailer,
  reporter: observability.reporter,
});
