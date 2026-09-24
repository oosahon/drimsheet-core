import express from 'express';
import request from 'supertest';

import mockReporter from '@shared/contracts/__mocks__/reporter.mock';

import mcpRouter from '@infra/ioc/mcp';
import { getJournalEntriesUseCase } from '@infra/ioc/usecases/journal-entry';
import { getLedgerAccountsUseCase } from '@infra/ioc/usecases/ledger';

jest.mock('@infra/config/vars.config', () => ({
  __esModule: true,
  default: { APP_URL: '', APP_ENV: 'local', APP_VERSION: '1.2.3' },
}));
jest.mock('@infra/ioc/usecases/ledger', () => ({
  getLedgerAccountsUseCase: jest.fn(),
}));
jest.mock('@infra/ioc/usecases/journal-entry', () => ({
  getJournalEntriesUseCase: jest.fn(),
}));
jest.mock('@infra/observability', () => ({
  __esModule: true,
  default: {
    reporter: jest.requireActual<
      typeof import('@shared/contracts/__mocks__/reporter.mock')
    >('@shared/contracts/__mocks__/reporter.mock').default,
  },
}));

describe('MCP composition', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it.each([
    ['get_ledger_accounts', getLedgerAccountsUseCase],
    ['get_journal_entries', getJournalEntriesUseCase],
  ] as const)(
    'connects %s to its existing application entry point',
    async (name, useCase) => {
      const result = {
        data: [],
        meta: { limit: 10, page: 1, total: 0, totalPages: 0 },
      };
      jest.mocked(useCase).mockResolvedValue(result);
      const app = express();
      app.use(express.json());
      app.use('/mcp', mcpRouter);
      const response = await request(app)
        .post('/mcp')
        .set('Host', 'localhost')
        .set('Accept', 'application/json, text/event-stream')
        .set('MCP-Protocol-Version', '2025-06-18')
        .send({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name, arguments: { limit: 5 } },
        });
      expect(response.status).toBe(200);
      expect(response.text).toContain(JSON.stringify(result));
      expect(useCase).toHaveBeenCalledWith({ limit: 5 });
      expect(mockReporter.report).not.toHaveBeenCalled();
    }
  );
});
