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
import { makeTracedUseCase } from '@infra/observability/usecase-tracing';
import counterpartyRepos from '@infra/persistence/repos/counterparty';
import appContext from '@infra/runtime/app-context';

export const createCounterpartyUseCase = makeTracedUseCase(
  'counterparty.createCounterpartyUseCase',
  makeCreateCounterpartyUsecase({
    appContext,
    counterpartyService,
    counterpartyPersistenceService,
    eventBus: messaging.eventBus,
  })
);

export const createVendorUseCase = makeTracedUseCase(
  'counterparty.createVendorUseCase',
  makeCreateVendorUsecase({
    appContext,
    counterpartyService,
    counterpartyPersistenceService,
    eventBus: messaging.eventBus,
  })
);

export const createContractorUseCase = makeTracedUseCase(
  'counterparty.createContractorUseCase',
  makeCreateContractorUsecase({
    appContext,
    counterpartyService,
    counterpartyPersistenceService,
    eventBus: messaging.eventBus,
  })
);

export const createEmployerUseCase = makeTracedUseCase(
  'counterparty.createEmployerUseCase',
  makeCreateEmployerUsecase({
    appContext,
    counterpartyService,
    counterpartyPersistenceService,
    eventBus: messaging.eventBus,
  })
);

export const getCounterpartiesUseCase = makeTracedUseCase(
  'counterparty.getCounterpartiesUseCase',
  makeGetCounterpartiesUsecase({
    appContext,
    counterpartyRepo: counterpartyRepos.counterparty,
  })
);
