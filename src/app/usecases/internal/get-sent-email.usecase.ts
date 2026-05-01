import { NODE_ENV } from '../../../infra/config/vars.config';
import { ITransactionalEmailDto } from '../../contracts/dto/workers.dto';
import { IInternalMailer } from '../../contracts/infra/transactional-email-agent.contract';
import httpError from '../../errors/http.error';

export default function getSentEmail(internalMailer: IInternalMailer) {
  return async (
    email: string,
    subject: string
  ): Promise<ITransactionalEmailDto | null> => {
    if (NODE_ENV !== 'test') {
      throw new httpError.Forbidden();
    }
    return internalMailer.getEmail(email, subject);
  };
}
