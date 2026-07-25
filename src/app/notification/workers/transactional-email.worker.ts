import IReporter from '../../../shared/contracts/reporter.contract';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import ITransactionalEmailAgent from '../contracts/transactional-email-agent.contract';
import { ITransactionalEmailDto } from '../dtos/transactional-email/transactional-email.dto';
import { transactionalEmailDtoSchema } from '../dtos/transactional-email/transactional-email.dto.validation';

interface IDependencies {
  mailer: ITransactionalEmailAgent;
  reporter: IReporter;
}

export default function makeTransactionalEmailWorker(deps: IDependencies) {
  return async (payload: ITransactionalEmailDto) => {
    zodValidationRunner(transactionalEmailDtoSchema, payload);

    try {
      await deps.mailer.send(payload);
    } catch (error) {
      deps.reporter.report(error, {
        type: 'transactional-email-delivery',
        correlationId: payload.correlationId,
      });
      throw error;
    }
  };
}
