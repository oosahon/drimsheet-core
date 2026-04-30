import { NODE_ENV } from '../../../infra/config/vars.config';
import { ErrorForbidden } from '../../../shared/errors/error';
import { ITransactionalEmailDto } from '../../contracts/dto/workers.dto';
import { IInternalMailer } from '../../contracts/infra/transactional-email-agent.contract';

export default function getSentEmail(internalMailer: IInternalMailer) {
  return async (
    email: string,
    subject: string
  ): Promise<ITransactionalEmailDto | null> => {
    if (NODE_ENV !== 'test') {
      throw new ErrorForbidden();
    }
    return internalMailer.getEmail(email, subject);
  };
}
