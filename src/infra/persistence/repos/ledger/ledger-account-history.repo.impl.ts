import ILedgerAccountHistoryRepo from '../../../../domain/ledger/shared/repos/ledger-account-history.repo';
import getDbQuery from '../../../../shared/helpers/get-db-query';
import { ledgerAccountHistoryInAudit } from '../../../config/drizzle/schema';
import ledgerAccountHistoryMapper from '../../mappers/ledger/ledger-account-history.mapper';

const ledgerAccountHistoryRepo: ILedgerAccountHistoryRepo = {
  save: async (histories, options) => {
    const values = Array.isArray(histories) ? histories : [histories];
    await getDbQuery(options)
      .insert(ledgerAccountHistoryInAudit)
      .values(values.map(ledgerAccountHistoryMapper.toRepo));
  },
};

export default ledgerAccountHistoryRepo;
