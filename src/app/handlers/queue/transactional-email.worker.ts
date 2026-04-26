import { ITransactionalEmailDto } from '../../contracts/dto/workers.dto';
import ITransactionalEmailAgent from '../../contracts/infra/transactional-email-agent.contract';

export default function makeTransactionalEmailWorker(
  mailer: ITransactionalEmailAgent
) {
  return async (payload: ITransactionalEmailDto) => {
    await mailer.send(payload);
  };
}
