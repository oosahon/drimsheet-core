import bookkeepingServices from '../../services/bookkeeping.service';
import ledgerDomainServices from '../../services/domain/ledger.domain.service';

const ledgerServices = Object.freeze({
  ...ledgerDomainServices,
  ...bookkeepingServices,
});

export default ledgerServices;
