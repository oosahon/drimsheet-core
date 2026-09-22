import { Express } from 'express';
import request from 'supertest';

import { TEntityId } from '@shared/types/uuid';
import appError from '@shared/values/errors/app.error';
import { IPaginatedResponse } from '@shared/values/pagination/types/pagination.types';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';
import { IUser } from '@domain/user/types/user.types';

import mockFeatureFlagService from '@app/context/contracts/__mocks__/feature-flag.service.mock';
import { IJournalEntryListDto } from '@app/journal-entry/dtos/journal-entry/journal-entry.dto';

import { tokenService } from '@infra/ioc/services/auth';
import * as journalEntryUseCases from '@infra/ioc/usecases/journal-entry';
import accountingRepos from '@infra/persistence/repos/accounting';
import userRepos from '@infra/persistence/repos/user';
import { createApplication } from '@infra/server';

jest.mock(
  '@infra/integrations/launchdarkly/launchdarkly-feature-flag.service',
  () => ({
    __esModule: true,
    default: jest.requireActual<
      typeof import('@app/context/contracts/__mocks__/feature-flag.service.mock')
    >('@app/context/contracts/__mocks__/feature-flag.service.mock').default,
  })
);

jest.mock('../../../src/infra/ioc/services/auth', () => ({
  __esModule: true,
  tokenService: { getAuthUser: jest.fn() },
}));

jest.mock('../../../src/infra/ioc/usecases/journal-entry', () => ({
  __esModule: true,
  getArchivedJournalEntriesUseCase: jest.fn(),
  getJournalEntryUseCase: jest.fn(),
  createPaymentUseCase: jest.fn(),
  createReceiptUseCase: jest.fn(),
  createTransferUseCase: jest.fn(),
}));

jest.mock('../../../src/infra/persistence/repos/accounting', () => ({
  __esModule: true,
  default: {
    accountingEntity: { findByIdAndUserId: jest.fn() },
  },
}));

jest.mock('../../../src/infra/persistence/repos/user', () => ({
  __esModule: true,
  default: {
    user: { findById: jest.fn() },
  },
}));

const ENDPOINT = '/api/v1/journal-entries/archived';
const userId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
const accountingEntityId = '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
const accountId = '123e4567-e89b-12d3-a456-426614174003' as TEntityId;
const entryId = '123e4567-e89b-12d3-a456-426614174004' as TEntityId;
const lineId = '123e4567-e89b-12d3-a456-426614174005' as TEntityId;
const counterpartyId = '123e4567-e89b-12d3-a456-426614174006' as TEntityId;
const now = new Date('2026-09-16T09:00:00.000Z');

const user = {
  id: userId,
  version: 1,
  email: 'journal@example.com',
  emailVerified: true,
  firstName: 'Journal',
  lastName: 'Owner',
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
} satisfies IUser;

const accountingEntity = {
  id: accountingEntityId,
  ownerId: userId,
  name: 'Journal Business',
  type: 'individual',
  functionalCurrencyCode: 'NGN',
  jurisdictionCode: 'NG',
  createdAt: now,
  updatedAt: now,
} satisfies IAccountingEntity;

const journalEntry = {
  id: entryId,
  accountingEntityId,
  sourceType: 'receipt',
  memo: 'Customer receipt',
  status: 'archived',
  effectiveDate: new Date('2026-09-15T00:00:00.000Z'),
  postedAt: null,
  voidedAt: null,
  voidingEntryId: null,
  version: 1,
  createdBy: userId,
  createdAt: now,
  updatedAt: now,
  attachments: [],
  lines: [
    {
      id: lineId,
      entryId,
      account: { id: accountId, name: 'Cash' },
      counterparty: { id: counterpartyId, name: 'Acme Ltd' },
      sequenceOrder: 1,
      amount: { amount: 50_00, currencyCode: 'NGN', isMinorUnit: true },
      exchangeRate: null,
      functionalAmount: {
        amount: 50_00,
        currencyCode: 'NGN',
        isMinorUnit: true,
      },
      side: 'debit',
      description: 'Cash received',
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
  ],
} satisfies IJournalEntryListDto;

const paginatedEntries = {
  data: [journalEntry],
  meta: { page: 2, limit: 5, total: 1, totalPages: 1 },
} satisfies IPaginatedResponse<IJournalEntryListDto>;

describe('GET /journal-entries/archived', () => {
  let app: Express;
  const mockGetAuthUser = tokenService.getAuthUser as jest.Mock;
  const mockFindUser = userRepos.user.findById as jest.Mock;
  const mockFindAccountingEntity = accountingRepos.accountingEntity
    .findByIdAndUserId as jest.Mock;
  const mockGetArchivedJournalEntries =
    journalEntryUseCases.getArchivedJournalEntriesUseCase as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFeatureFlagService.canAccessAlpha1.mockResolvedValue(true);
    mockGetAuthUser.mockResolvedValue({ id: userId });
    mockFindUser.mockResolvedValue(user);
    mockFindAccountingEntity.mockResolvedValue(accountingEntity);
    mockGetArchivedJournalEntries.mockResolvedValue(paginatedEntries);
    app = createApplication();
  });

  const makeRequest = (query: object = {}) =>
    request(app)
      .get(ENDPOINT)
      .set('Authorization', 'Bearer valid-token')
      .set('x-accounting-entity-id', accountingEntityId)
      .query(query);

  describe('200 Response', () => {
    it('returns journal entries and forwards coerced query values', async () => {
      const response = await makeRequest({
        accountId,
        page: 2,
        limit: 5,
        orderBy: 'effectiveDate',
        sortDirection: 'asc',
        search: 'receipt',
      });

      expect(response.status).toBe(200);
      expect(response.type).toBe('application/json');
      expect(response.body).toEqual({
        data: [
          {
            ...journalEntry,
            effectiveDate: journalEntry.effectiveDate.toISOString(),
            postedAt: null,
            createdAt: journalEntry.createdAt.toISOString(),
            updatedAt: journalEntry.updatedAt.toISOString(),
            lines: journalEntry.lines.map((line) => ({
              ...line,
              createdAt: line.createdAt.toISOString(),
              updatedAt: line.updatedAt.toISOString(),
            })),
          },
        ],
        meta: paginatedEntries.meta,
      });
      expect(mockFindAccountingEntity).toHaveBeenCalledWith(
        accountingEntityId,
        userId,
        expect.any(Object)
      );
      expect(mockGetArchivedJournalEntries).toHaveBeenCalledWith({
        accountId,
        page: 2,
        limit: 5,
        orderBy: 'effectiveDate',
        sortDirection: 'asc',
        search: 'receipt',
      });
    });
  });

  describe('200 Response', () => {
    it('returns an empty archive and forwards omitted pagination', async () => {
      const emptyPage = {
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      mockGetArchivedJournalEntries.mockResolvedValueOnce(emptyPage);
      const response = await makeRequest();
      expect(response.status).toBe(200);
      expect(response.body).toEqual(emptyPage);
      expect(mockGetArchivedJournalEntries).toHaveBeenCalledWith({});
      expect(
        journalEntryUseCases.getJournalEntryUseCase
      ).not.toHaveBeenCalled();
    });

    it('continues routing an entry ID to the detail use case', async () => {
      jest
        .mocked(journalEntryUseCases.getJournalEntryUseCase)
        .mockResolvedValueOnce(journalEntry);
      const response = await request(app)
        .get('/api/v1/journal-entries/' + entryId)
        .set('Authorization', 'Bearer valid-token')
        .set('x-accounting-entity-id', accountingEntityId);
      expect(response.status).toBe(200);
      expect(journalEntryUseCases.getJournalEntryUseCase).toHaveBeenCalledWith(
        entryId
      );
      expect(mockGetArchivedJournalEntries).not.toHaveBeenCalled();
    });
  });

  describe('400 Response', () => {
    it('rejects a malformed accounting entity header', async () => {
      const response = await request(app)
        .get(ENDPOINT)
        .set('Authorization', 'Bearer valid-token')
        .set('x-accounting-entity-id', 'invalid');
      expect(response.status).toBe(400);
      expect(mockGetArchivedJournalEntries).not.toHaveBeenCalled();
    });
  });

  describe('401 Response', () => {
    it('rejects invalid credentials', async () => {
      mockGetAuthUser.mockRejectedValueOnce(new appError.Unauthorized());
      const response = await makeRequest();
      expect(response.status).toBe(401);
      expect(mockGetArchivedJournalEntries).not.toHaveBeenCalled();
    });

    it('rejects an unauthenticated request', async () => {
      const response = await request(app)
        .get(ENDPOINT)
        .set('x-accounting-entity-id', accountingEntityId);

      expect(response.status).toBe(401);
      expect(mockGetArchivedJournalEntries).not.toHaveBeenCalled();
    });
  });

  describe('403 Response', () => {
    it('rejects a foreign accounting entity context', async () => {
      mockFindAccountingEntity.mockResolvedValueOnce({
        ...accountingEntity,
        ownerId: '123e4567-e89b-12d3-a456-426614174999' as TEntityId,
      });

      const response = await makeRequest();

      expect(response.status).toBe(403);
      expect(mockGetArchivedJournalEntries).not.toHaveBeenCalled();
    });

    it('rejects a user without Alpha 1 access', async () => {
      mockFeatureFlagService.canAccessAlpha1.mockResolvedValueOnce(false);

      const response = await makeRequest();

      expect(response.status).toBe(403);
      expect(mockGetArchivedJournalEntries).not.toHaveBeenCalled();
    });
  });

  describe('422 Response', () => {
    it('rejects invalid query formats before orchestration', async () => {
      const response = await makeRequest({ limit: 'not-a-number' });

      expect(response.status).toBe(422);
      expect(response.body.errorKey).toBe('app_error_validation_error');
      expect(mockGetArchivedJournalEntries).not.toHaveBeenCalled();
    });

    it('maps use-case validation failures', async () => {
      const validationErrors = [
        {
          field: 'accountId',
          message: 'journal_line_error_account_id_invalid',
        },
      ];
      mockGetArchivedJournalEntries.mockRejectedValueOnce(
        new appError.UnprocessableEntity(validationErrors)
      );

      const response = await makeRequest({ accountId: 'invalid-account-id' });

      expect(response.status).toBe(422);
      expect(response.body.validationErrors).toEqual(validationErrors);
    });
  });

  describe('500 Response', () => {
    it('does not orchestrate without accounting entity context', async () => {
      const response = await request(app)
        .get(ENDPOINT)
        .set('Authorization', 'Bearer valid-token');
      expect(response.status).toBe(500);
      expect(mockGetArchivedJournalEntries).not.toHaveBeenCalled();
    });

    it('does not orchestrate when the entity cannot be resolved for the user', async () => {
      mockFindAccountingEntity.mockResolvedValueOnce(null);
      const response = await makeRequest();
      expect(response.status).toBe(500);
      expect(mockGetArchivedJournalEntries).not.toHaveBeenCalled();
    });

    it('sanitizes unexpected failures', async () => {
      mockGetArchivedJournalEntries.mockRejectedValueOnce(
        new Error('database failure')
      );

      const response = await makeRequest();

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        name: 'InternalServerError',
        errorKey: 'app_error_unexpected',
      });
    });
  });
});
