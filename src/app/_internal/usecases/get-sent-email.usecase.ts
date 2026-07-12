import IVarsConfig from '../../../shared/contracts/vars-config.contract';
import { IInternalMailer } from '../../notification/contracts/transactional-email-agent.contract';
import { ITransactionalEmailDto } from '../../notification/dtos/transactional-email.dto';
import appError from '../../shared/errors/app.error';

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
