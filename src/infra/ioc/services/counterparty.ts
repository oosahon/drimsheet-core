import makeCounterpartyPersistenceService from '../../../app/counterparty/services/persistence.service';
import makeCounterpartyService from '../../../domain/counterparty/services/counterparty.service';
import counterpartyRepos from '../../persistence/repos/counterparty';
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
