import makeCreateContractorUsecase from '../../../app/counterparty/usecases/create-contractor.usecase';
import makeCreateCounterpartyUsecase from '../../../app/counterparty/usecases/create-counterparty.usecase';
import makeCreateEmployerUsecase from '../../../app/counterparty/usecases/create-employer.usecase';
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

const createContractor = makeCreateContractorUsecase({
  appContext,
  counterpartyService: counterpartyServices.counterparty,
  counterpartyPersistenceService: counterpartyServices.persistence,
  eventBus: messaging.eventBus,
});

const createEmployer = makeCreateEmployerUsecase({
  appContext,
  counterpartyService: counterpartyServices.counterparty,
  counterpartyPersistenceService: counterpartyServices.persistence,
  eventBus: messaging.eventBus,
});

const counterpartyUseCases = Object.freeze({
  createCounterparty,
  createVendor,
  createContractor,
  createEmployer,
});

export default counterpartyUseCases;
