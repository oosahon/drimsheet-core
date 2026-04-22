import messaging from '../../../../infra/messaging';
import appContext from '../../../context';
import makeCreatePettyCashSubAccountUseCase from './create-petty-cash-sub-account.usecase';

const assetAccountUseCase = {
  createPettyCashSubAccount: makeCreatePettyCashSubAccountUseCase(
    appContext.request,
    messaging.eventBus
  ),
};

export default assetAccountUseCase;
