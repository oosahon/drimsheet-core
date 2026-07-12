import internalMailer from '../../../infra/config/internal-mailer.config';
import { NODE_ENV } from '../../../infra/config/vars.config';
import zeptoMail from '../../../infra/config/zeptomail.config';
import observability from '../../../infra/observability';
import makeTransactionalEmailWorker from './transactional-email.worker';

const mailer = NODE_ENV === 'test' ? internalMailer : zeptoMail.notifications;

const notificationWorkers = {
  transactionalEmail: makeTransactionalEmailWorker({
    mailer,
    reporter: observability.reporter,
  }),
};

export default notificationWorkers;
