import vars from '@infra/config/vars.config';
import { getJournalEntriesUseCase } from '@infra/ioc/usecases/journal-entry';
import { getLedgerAccountsUseCase } from '@infra/ioc/usecases/ledger';
import observability from '@infra/observability';

import createMcpRouter from '@interface/mcp/router';
import createMcpServer from '@interface/mcp/server';

const mcpRouter = createMcpRouter({
  appUrl: vars.APP_URL,
  isLocal: vars.APP_ENV === 'local',
  createServer: () =>
    createMcpServer({
      version: vars.APP_VERSION,
      getLedgerAccounts: getLedgerAccountsUseCase,
      getJournalEntries: getJournalEntriesUseCase,
      reporter: observability.reporter,
    }),
});

export default mcpRouter;
