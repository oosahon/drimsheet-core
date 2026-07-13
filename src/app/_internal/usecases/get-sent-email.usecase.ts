import IVarsConfig from '../../../shared/contracts/vars-config.contract';
import appError from '../../../shared/errors/app.error';
import { IInternalMailer } from '../../notification/contracts/transactional-email-agent.contract';
import { ITransactionalEmailDto } from '../../notification/dtos/transactional-email/transactional-email.dto';

interface IDependencies {
  internalMailer: IInternalMailer;
  varsConfig: IVarsConfig;
}

export default function getSentEmail(deps: IDependencies) {
  return async (
    email: string,
    subject: string
  ): Promise<ITransactionalEmailDto | null> => {
    if (deps.varsConfig.NODE_ENV !== 'test') {
      throw new appError.Forbidden();
    }
    return deps.internalMailer.getEmail(email, subject);
  };
}
