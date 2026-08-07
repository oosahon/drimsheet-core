import ILedgerAccountHistoryRepo from '../../../../domain/ledger/repos/ledger-account-history.repo';
import { ledgerAccountHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../../helpers/get-db-query';
import ledgerAccountHistoryMapper from './mappers/ledger-account-history.mapper';

const ledgerAccountHistoryRepo: ILedgerAccountHistoryRepo = {
  save: async (histories, options) => {
    const values = Array.isArray(histories) ? histories : [histories];
    await getDbQuery(options)
      .insert(ledgerAccountHistoryInAudit)
      .values(values.map(ledgerAccountHistoryMapper.toRepo));
  },
};

export default ledgerAccountHistoryRepo;
