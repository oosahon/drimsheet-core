import IVarsConfig from '../../../shared/contracts/vars-config.contract';
import { IInternalMailer } from '../../notification/contracts/transactional-email-agent.contract';
import { ITransactionalEmailDto } from '../../notification/dtos/transactional-email.dto';
import appError from '../../shared/errors/app.error';

export default function getSentEmail(
  internalMailer: IInternalMailer,
  varsConfig: IVarsConfig
) {
  return async (
    email: string,
    subject: string
  ): Promise<ITransactionalEmailDto | null> => {
    if (varsConfig.NODE_ENV !== 'test') {
      throw new appError.Forbidden();
    }
    return internalMailer.getEmail(email, subject);
  };
}
