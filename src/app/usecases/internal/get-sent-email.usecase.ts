import { NODE_ENV } from '../../../infra/config/vars.config';
import { ErrorForbidden } from '../../../shared/value-objects/error';
import {
  IInternalMailer,
  ITransactionalEmailPayload,
} from '../../contracts/infra/transactional-email-agent.contract';

export default function getSentEmail(internalMailer: IInternalMailer) {
  return async (
    email: string,
    subject: string
  ): Promise<ITransactionalEmailPayload | null> => {
    if (NODE_ENV !== 'test') {
      throw new ErrorForbidden();
    }
    return internalMailer.getEmail(email, subject);
  };
}
