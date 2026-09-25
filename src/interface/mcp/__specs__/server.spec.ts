import { createMcpHandler } from '@modelcontextprotocol/server';

import mockReporter from '@shared/contracts/__mocks__/reporter.mock';
import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';
import appError from '@shared/values/errors/app.error';

import { IJournalEntryListDto } from '@app/journal-entry/dtos/journal-entry/journal-entry.dto';

import createMcpServer from '@interface/mcp/server';

type TDependencies = Parameters<typeof createMcpServer>[0];

const getLedgerAccounts = jest.fn<
  ReturnType<TDependencies['getLedgerAccounts']>,
  Parameters<TDependencies['getLedgerAccounts']>
>();
const getJournalEntries = jest.fn<
  ReturnType<TDependencies['getJournalEntries']>,
  Parameters<TDependencies['getJournalEntries']>
>();
const meta = { page: 1, limit: 10, total: 0, totalPages: 0 };

describe('MCP server', () => {
  let handler: ReturnType<typeof createMcpHandler>;

  beforeEach(() => {
    jest.resetAllMocks();
    getLedgerAccounts.mockResolvedValue({ data: [], meta });
    getJournalEntries.mockResolvedValue({ data: [], meta });
    handler = createMcpHandler(() =>
      createMcpServer({
        version: 'test',
        getLedgerAccounts,
        getJournalEntries,
        reporter: mockReporter,
      })
    );
  });

  afterEach(async () => {
    await handler.close();
  });

  async function send(method: string, params?: object) {
    const response = await handler.fetch(
      new Request('http://localhost/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          'MCP-Protocol-Version': '2025-06-18',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      })
    );
    const body = await response.text();
    const eventData = body
      .split('\n')
      .find((line) => line.startsWith('data: '));
    return JSON.parse(eventData ? eventData.slice(6) : body);
  }

  it('advertises exactly two read tools with existing query constraints', async () => {
    const response = await send('tools/list');
    expect(response.result.tools).toEqual([
      expect.objectContaining({
        name: 'get_ledger_accounts',
        annotations: { readOnlyHint: true },
        inputSchema: expect.objectContaining({
          properties: expect.objectContaining({
            limit: expect.objectContaining({ maximum: 200 }),
            type: expect.any(Object),
          }),
        }),
      }),
      expect.objectContaining({
        name: 'get_journal_entries',
        annotations: { readOnlyHint: true },
        inputSchema: expect.objectContaining({
          properties: expect.objectContaining({
            accountId: expect.any(Object),
            status: expect.any(Object),
          }),
        }),
      }),
    ]);
    expect(getLedgerAccounts).not.toHaveBeenCalled();
    expect(getJournalEntries).not.toHaveBeenCalled();
  });

  it.each(['get_ledger_accounts', 'get_journal_entries'])(
    'dispatches %s once and preserves pagination metadata',
    async (name) => {
      const query = { page: 2, limit: 5, search: 'Operating' };
      const response = await send('tools/call', { name, arguments: query });
      const useCase =
        name === 'get_ledger_accounts' ? getLedgerAccounts : getJournalEntries;
      expect(useCase).toHaveBeenCalledTimes(1);
      expect(useCase).toHaveBeenCalledWith(query);
      expect(response.result.structuredContent).toEqual({ data: [], meta });
      expect(response.result.content).toEqual([
        { type: 'text', text: JSON.stringify({ data: [], meta }) },
      ]);
    }
  );

  it('serializes dates consistently without changing minor-unit amounts', async () => {
    const now = new Date('2026-09-24T10:00:00.000Z');
    const entry: IJournalEntryListDto = {
      id: 'entry',
      accountingEntityId: 'entity',
      sourceType: 'receipt',
      memo: null,
      status: 'posted',
      effectiveDate: now,
      postedAt: now,
      voidedAt: null,
      voidingEntryId: null,
      version: 1,
      createdBy: generateUUID(),
      createdAt: now,
      updatedAt: now,
      attachments: [],
      lines: [
        {
          id: 'line',
          entryId: 'entry',
          account: { id: 'account', name: 'Bank' },
          counterparty: null,
          sequenceOrder: 1,
          amount: { amount: 12345, currencyCode: 'NGN', isMinorUnit: true },
          exchangeRate: null,
          functionalAmount: {
            amount: 12345,
            currencyCode: 'NGN',
            isMinorUnit: true,
          },
          side: 'debit',
          description: null,
          version: 1,
          createdAt: now,
          updatedAt: now,
        },
      ],
    };
    getJournalEntries.mockResolvedValue({ data: [entry], meta });
    const response = await send('tools/call', {
      name: 'get_journal_entries',
      arguments: {},
    });
    expect(response.result.structuredContent).toEqual(
      JSON.parse(JSON.stringify({ data: [entry], meta }))
    );
    expect(JSON.parse(response.result.content[0].text)).toEqual(
      response.result.structuredContent
    );
  });

  it.each([
    ['get_ledger_accounts', { limit: 201 }],
    ['get_ledger_accounts', { type: 'invented' }],
    ['get_journal_entries', { accountId: 'invalid-id' }],
    ['get_journal_entries', { status: 'draft' }],
  ])(
    'rejects invalid %s arguments before calling a use case',
    async (name, args) => {
      const response = await send('tools/call', { name, arguments: args });
      expect(response.result.isError).toBe(true);
      expect(getLedgerAccounts).not.toHaveBeenCalled();
      expect(getJournalEntries).not.toHaveBeenCalled();
    }
  );

  it.each(['get_ledger_accounts', 'get_journal_entries'])(
    'returns safe known errors for %s',
    async (name) => {
      const useCase =
        name === 'get_ledger_accounts' ? getLedgerAccounts : getJournalEntries;
      useCase.mockRejectedValue(
        new appError.BadRequest({ privateValue: 'secret' })
      );
      const response = await send('tools/call', { name, arguments: {} });
      expect(response.result).toEqual({
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({ errorKey: 'app_error_request_invalid' }),
          },
        ],
      });
      expect(mockReporter.report).not.toHaveBeenCalled();
    }
  );

  it.each([
    new Error('secret SQL payload'),
    new appError.InternalServerError({ secret: 'private' }),
    { errorKey: 'error_amount_invalid', message: 'private' },
  ])('sanitizes and reports unexpected failures once', async (error) => {
    getLedgerAccounts.mockRejectedValue(error);
    const response = await send('tools/call', {
      name: 'get_ledger_accounts',
      arguments: {},
    });
    expect(response.result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify({ errorKey: 'app_error_unexpected' }),
        },
      ],
    });
    expect(mockReporter.report).toHaveBeenCalledTimes(1);
    expect(mockReporter.report).toHaveBeenCalledWith('mcp.tool.failed', error);
  });

  it('does not expose unknown tools', async () => {
    const response = await send('tools/call', {
      name: 'create_journal_entry',
      arguments: {},
    });
    expect(response.error).toEqual(
      expect.objectContaining({ code: expect.any(Number) })
    );
    expect(getLedgerAccounts).not.toHaveBeenCalled();
    expect(getJournalEntries).not.toHaveBeenCalled();
  });
});
