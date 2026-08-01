import makeCreateCounterpartyUsecase from '../../../app/counterparty/usecases/create-counterparty.usecase';
import messaging from '../../messaging';
import appContext from '../../runtime/app-context';
import counterpartyServices from '../services/counterparty';

const createCounterparty = makeCreateCounterpartyUsecase({
  appContext,
  counterpartyService: counterpartyServices.counterparty,
  counterpartyPersistenceService: counterpartyServices.persistence,
  eventBus: messaging.eventBus,
});

const counterpartyUseCases = Object.freeze({
  createCounterparty,
});

export default counterpartyUseCases;
