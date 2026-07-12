import ILedgerAccountHistoryRepo from '../../../../domain/ledger/shared/repos/ledger-account-history.repo';
import { ledgerAccountHistoryInAudit } from '../../../config/drizzle/schema';
import ledgerAccountHistoryMapper from '../../mappers/ledger/ledger-account-history.mapper';
import getDbQuery from '../helpers/query';

const ledgerAccountHistoryRepo: ILedgerAccountHistoryRepo = {
  save: async (histories, options) => {
    const values = Array.isArray(histories) ? histories : [histories];
    await getDbQuery(options)
      .insert(ledgerAccountHistoryInAudit)
      .values(values.map(ledgerAccountHistoryMapper.toRepo));
  },
};

export default ledgerAccountHistoryRepo;
