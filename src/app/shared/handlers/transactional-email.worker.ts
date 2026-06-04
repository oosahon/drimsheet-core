import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import ITransactionalEmailAgent from '../contracts/transactional-email-agent.contract';
import {
  ITransactionalEmailDto,
  transactionalEmailDtoSchema,
} from '../dtos/workers.dto';

export default function makeTransactionalEmailWorker(
  mailer: ITransactionalEmailAgent
) {
  return async (payload: ITransactionalEmailDto) => {
    zodValidationRunner(transactionalEmailDtoSchema, payload);

    await mailer.send(payload);
  };
}
