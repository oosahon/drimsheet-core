import ILedgerAccountBalanceEnrichmentService from '@app/ledger/contracts/ledger-account-balance-enrichment.service.contract';

const mockLedgerAccountBalanceEnrichmentService: jest.Mocked<ILedgerAccountBalanceEnrichmentService> =
  { enrich: jest.fn() };

export default mockLedgerAccountBalanceEnrichmentService;
