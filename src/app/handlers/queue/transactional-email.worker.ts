import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import {
  ITransactionalEmailDto,
  transactionalEmailDtoSchema,
} from '../../contracts/dto/workers.dto';
import ITransactionalEmailAgent from '../../contracts/infra/transactional-email-agent.contract';

export default function makeTransactionalEmailWorker(
  mailer: ITransactionalEmailAgent
) {
  return async (payload: ITransactionalEmailDto) => {
    zodValidationRunner(transactionalEmailDtoSchema, payload);

    await mailer.send(payload);
  };
}
