import makeCreateCounterpartyUsecase from '../../../app/counterparty/usecases/create-counterparty.usecase';
import makeCreateVendorUsecase from '../../../app/counterparty/usecases/create-vendor.usecase';
import messaging from '../../messaging';
import appContext from '../../runtime/app-context';
import counterpartyServices from '../services/counterparty';

const createCounterparty = makeCreateCounterpartyUsecase({
  appContext,
  counterpartyService: counterpartyServices.counterparty,
  counterpartyPersistenceService: counterpartyServices.persistence,
  eventBus: messaging.eventBus,
});

const createVendor = makeCreateVendorUsecase({
  appContext,
  counterpartyService: counterpartyServices.counterparty,
  counterpartyPersistenceService: counterpartyServices.persistence,
  eventBus: messaging.eventBus,
});

const counterpartyUseCases = Object.freeze({
  createCounterparty,
  createVendor,
});

export default counterpartyUseCases;
