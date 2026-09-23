import makeCounterpartyService from '@domain/counterparty/services/counterparty.service';

import makeCounterpartyAppService from '@app/counterparty/services/counterparty.service';

import counterpartyRepos from '@infra/persistence/repos/counterparty';

export const counterpartyService = makeCounterpartyService();

export const counterpartyAppService = makeCounterpartyAppService({
  counterpartyRepo: counterpartyRepos.counterparty,
  counterpartyService,
});
