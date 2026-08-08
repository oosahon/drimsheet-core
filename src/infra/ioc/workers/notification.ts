import makeTransactionalEmailWorker from '@app/notification/workers/transactional-email.worker';

import internalMailer from '@infra/config/internal-mailer.config';
import { NODE_ENV } from '@infra/config/vars.config';
import zeptoMail from '@infra/config/zeptomail.config';
import observability from '@infra/observability';

const mailer = NODE_ENV === 'test' ? internalMailer : zeptoMail.notifications;

export const transactionalEmailWorker = makeTransactionalEmailWorker({
  mailer,
  reporter: observability.reporter,
});
