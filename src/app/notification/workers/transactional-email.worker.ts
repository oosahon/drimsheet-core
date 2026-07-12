import IReporter from '../../../shared/contracts/reporter.contract';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import ITransactionalEmailAgent from '../contracts/transactional-email-agent.contract';
import {
  ITransactionalEmailDto,
  transactionalEmailDtoSchema,
} from '../dtos/transactional-email.dto';

interface IDependencies {
  mailer: ITransactionalEmailAgent;
  reporter: IReporter;
}

export default function makeTransactionalEmailWorker(deps: IDependencies) {
  return async (payload: ITransactionalEmailDto) => {
    zodValidationRunner(transactionalEmailDtoSchema, payload);

    await deps.mailer.send(payload).catch(deps.reporter.report);
  };
}
