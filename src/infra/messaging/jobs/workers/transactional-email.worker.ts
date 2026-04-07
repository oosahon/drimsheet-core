import { Worker } from 'bullmq';
import { ITransactionalEmailPayload } from '../../../../app/contracts/infra/transactional-email-agent.contract';
import mailer from '../../../config/zeptomail.config';
import reporter from '../../../observability/reporter';
import { queueConnection } from '../../../config/redis.config';

export default function transactionalEmailWorker() {
  return new Worker(
    'transactional-email',
    async (job) => {
      try {
        const { correlationId, ...emailPayload } =
          job.data as ITransactionalEmailPayload;
        await mailer.notifications.send(emailPayload);
      } catch (error) {
        reporter.report(error, { job });
      }
    },
    {
      connection: queueConnection,
    }
  );
}
