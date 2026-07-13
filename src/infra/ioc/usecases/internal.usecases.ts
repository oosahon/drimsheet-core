import makeGetSentEmailUseCase from '../../../app/_internal/usecases/get-sent-email.usecase';
import internalMailer from '../../config/internal-mailer.config';
import * as varsConfig from '../../config/vars.config';

const internalUseCases = {
  getSentEmail: makeGetSentEmailUseCase({ internalMailer, varsConfig }),
};

export default internalUseCases;
