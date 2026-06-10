import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import IReporter from '../../shared/contracts/reporter.contract';
import ITransactionalEmailAgent from '../contracts/transactional-email-agent.contract';
import {
  ITransactionalEmailDto,
  transactionalEmailDtoSchema,
} from '../dtos/transactional-email.dto';

export default function makeTransactionalEmailWorker(
  mailer: ITransactionalEmailAgent,
  reporter: IReporter
) {
  return async (payload: ITransactionalEmailDto) => {
    zodValidationRunner(transactionalEmailDtoSchema, payload);

    await mailer.send(payload).catch(reporter.report);
  };
}
