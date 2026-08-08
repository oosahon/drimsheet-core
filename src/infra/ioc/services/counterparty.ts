import makeCounterpartyService from '@domain/counterparty/services/counterparty.service';

import makeCounterpartyAppService from '@app/counterparty/services/counterparty.service';
import makeCounterpartyPersistenceService from '@app/counterparty/services/persistence.service';

import counterpartyRepos from '@infra/persistence/repos/counterparty';

import { repoService } from './repo';

export const counterpartyService = makeCounterpartyService();

export const counterpartyPersistenceService =
  makeCounterpartyPersistenceService({
    counterpartyRepo: counterpartyRepos.counterparty,
    vendorRepo: counterpartyRepos.vendor,
    contractorRepo: counterpartyRepos.contractor,
    employerRepo: counterpartyRepos.employer,
    repoService: repoService,
  });

export const counterpartyAppService = makeCounterpartyAppService({
  counterpartyRepo: counterpartyRepos.counterparty,
  counterpartyService,
});
