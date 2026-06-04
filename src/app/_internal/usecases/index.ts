import internalMailer from '../../../infra/config/internal-mailer.config';
import getSentEmail from './get-sent-email.usecase';

const internalUseCases = {
  getSentEmail: getSentEmail(internalMailer),
};

export default internalUseCases;
