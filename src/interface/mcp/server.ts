import { CallToolResult, McpServer } from '@modelcontextprotocol/server';

import IReporter from '@shared/contracts/reporter.contract';

import { getJournalEntriesQueryValidationSchema } from '@app/journal-entry/dtos/journal-entry/journal-entry.dto.validation';
import type makeGetJournalEntriesUsecase from '@app/journal-entry/usecases/get-journal-entries.usecase';
import { getLedgerAccountQueryValidationSchema } from '@app/ledger/dtos/ledger-account/ledger-account.dto.validation';
import type makeGetLedgerAccountsUsecase from '@app/ledger/usecases/get-ledger-accounts.usecase';

import makeMcpErrorHandler from './error.handler';

interface IDependencies {
  version: string;
  getLedgerAccounts: ReturnType<typeof makeGetLedgerAccountsUsecase>;
  getJournalEntries: ReturnType<typeof makeGetJournalEntriesUsecase>;
  reporter: IReporter;
}

/** Normalize DTO dates to their JSON representation for both result formats. */
function toToolResult(response: object): CallToolResult {
  const text = JSON.stringify(response);
  const structuredContent: Record<string, unknown> = JSON.parse(text);

  return { content: [{ type: 'text', text }], structuredContent };
}

/** Construct one request's tool catalogue using existing application reads. */
export default function createMcpServer(deps: IDependencies): McpServer {
  const server = new McpServer({
    name: 'drimsheet-core',
    version: deps.version,
  });
  const handleError = makeMcpErrorHandler(deps.reporter);

  // TODO: replace this with a tools array https://drimsheet-app.atlassian.net/browse/ENG-144
  server.registerTool(
    'get_ledger_accounts',
    {
      description:
        'List ledger accounts in the current accounting-entity context. Filter by type, subtype, behavior, control-account status, or search; paginate and sort with the query fields. Defaults to 10 results, maximum 200 per page. Money amounts use minor units with their currency code.',
      inputSchema: getLedgerAccountQueryValidationSchema,
      annotations: { readOnlyHint: true },
    },
    async (query) => {
      try {
        const ledgerAccounts = await deps.getLedgerAccounts(query);
        return toToolResult(ledgerAccounts);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  server.registerTool(
    'get_journal_entries',
    {
      description:
        'List journal entries in the current accounting-entity context. Filter by account, counterparty, posted/archived status, or search; paginate and sort with the query fields. Defaults to 10 results, maximum 200 per page. Money amounts use minor units with their currency code.',
      inputSchema: getJournalEntriesQueryValidationSchema,
      annotations: { readOnlyHint: true },
    },
    async (query) => {
      try {
        const journalEntries = await deps.getJournalEntries(query);
        return toToolResult(journalEntries);
      } catch (error) {
        return handleError(error);
      }
    }
  );

  return server;
}
