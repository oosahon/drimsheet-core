import counterpartyHistoryRepo from './counterparty-history.repo.impl';
import counterpartyRepo from './counterparty.repo.impl';

const counterpartyRepos = {
  counterparty: counterpartyRepo,
  counterpartyHistory: counterpartyHistoryRepo,
};
export default counterpartyRepos;
