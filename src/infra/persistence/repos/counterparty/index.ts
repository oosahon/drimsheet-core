import contractorHistoryRepo from './contractor-history.repo.impl';
import contractorRepo from './contractor.repo.impl';
import counterpartyHistoryRepo from './counterparty-history.repo.impl';
import counterpartyRepo from './counterparty.repo.impl';
import employerHistoryRepo from './employer-history.repo.impl';
import employerRepo from './employer.repo.impl';
import vendorHistoryRepo from './vendor-history.repo.impl';
import vendorRepo from './vendor.repo.impl';

const counterpartyRepos = {
  counterparty: counterpartyRepo,
  counterpartyHistory: counterpartyHistoryRepo,
  employer: employerRepo,
  employerHistory: employerHistoryRepo,
  vendor: vendorRepo,
  vendorHistory: vendorHistoryRepo,
  contractor: contractorRepo,
  contractorHistory: contractorHistoryRepo,
};

export default counterpartyRepos;
