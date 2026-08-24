import makeTransactionalEmailWorker from '@app/notification/workers/transactional-email.worker';

import internalMailer from '@infra/config/internal-mailer.config';
import vars from '@infra/config/vars.config';
import zeptoMail from '@infra/integrations/zeptomail/zeptomail-email-agent';

const mailer =
  vars.NODE_ENV === 'test' ? internalMailer : zeptoMail.notifications;

export const transactionalEmailWorker = makeTransactionalEmailWorker({
  mailer,
});
