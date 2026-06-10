import internalMailer from '../../../infra/config/internal-mailer.config';
import * as varsConfig from '../../../infra/config/vars.config';
import getSentEmail from './get-sent-email.usecase';

const internalUseCases = {
  getSentEmail: getSentEmail(internalMailer, varsConfig),
};

export default internalUseCases;
