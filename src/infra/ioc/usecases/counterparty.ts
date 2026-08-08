import makeCreateContractorUsecase from '@app/counterparty/usecases/create-contractor.usecase';
import makeCreateCounterpartyUsecase from '@app/counterparty/usecases/create-counterparty.usecase';
import makeCreateEmployerUsecase from '@app/counterparty/usecases/create-employer.usecase';
import makeCreateVendorUsecase from '@app/counterparty/usecases/create-vendor.usecase';
import makeGetCounterpartiesUsecase from '@app/counterparty/usecases/get-counterparties.usecase';

import {
  counterpartyPersistenceService,
  counterpartyService,
} from '@infra/ioc/services/counterparty';
import messaging from '@infra/messaging';
import counterpartyRepos from '@infra/persistence/repos/counterparty';
import appContext from '@infra/runtime/app-context';

export const createCounterpartyUseCase = makeCreateCounterpartyUsecase({
  appContext,
  counterpartyService,
  counterpartyPersistenceService,
  eventBus: messaging.eventBus,
});

export const createVendorUseCase = makeCreateVendorUsecase({
  appContext,
  counterpartyService,
  counterpartyPersistenceService,
  eventBus: messaging.eventBus,
});

export const createContractorUseCase = makeCreateContractorUsecase({
  appContext,
  counterpartyService,
  counterpartyPersistenceService,
  eventBus: messaging.eventBus,
});

export const createEmployerUseCase = makeCreateEmployerUsecase({
  appContext,
  counterpartyService,
  counterpartyPersistenceService,
  eventBus: messaging.eventBus,
});

export const getCounterpartiesUseCase = makeGetCounterpartiesUsecase({
  appContext,
  counterpartyRepo: counterpartyRepos.counterparty,
});
