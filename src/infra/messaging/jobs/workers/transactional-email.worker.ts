import { Worker } from 'bullmq';
import { ITransactionalEmailPayload } from '../../../../app/contracts/infra/transactional-email-agent.contract';
import internalMailer from '../../../config/internal-mailer.config';
import { queueConnection } from '../../../config/redis.config';
import { NODE_ENV } from '../../../config/vars.config';
import zeptoMail from '../../../config/zeptomail.config';
import reporter from '../../../observability/reporter';

const mailer = NODE_ENV === 'test' ? internalMailer : zeptoMail.notifications;

export default function transactionalEmailWorker() {
  return new Worker(
    'transactional-email',
    async (job) => {
      try {
        const { correlationId, ...emailPayload } =
          job.data as ITransactionalEmailPayload;
        await mailer.send(emailPayload);
      } catch (error) {
        reporter.report(error, { job });
      }
    },
    {
      connection: queueConnection,
    }
  );
}
