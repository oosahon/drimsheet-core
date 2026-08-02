import { Express } from 'express';
import request from 'supertest';
import { IAccountingEntity } from '../../../src/domain/accounting/types/accounting-entity.types';
import { IUser } from '../../../src/domain/user/types/user.types';
import { tokenService } from '../../../src/infra/ioc/services/auth';
import * as counterpartyUseCases from '../../../src/infra/ioc/usecases/counterparty';
import accountingRepos from '../../../src/infra/persistence/repos/accounting';
import userRepos from '../../../src/infra/persistence/repos/user';
import { createApplication } from '../../../src/infra/server';
import { TEntityId } from '../../../src/shared/types/uuid';
import appError from '../../../src/shared/values/errors/app.error';

jest.mock('../../../src/infra/ioc/services/auth', () => ({
  __esModule: true,
  tokenService: { getAuthUser: jest.fn() },
}));

jest.mock('../../../src/infra/ioc/usecases/counterparty', () => ({
  __esModule: true,
  createCounterpartyUseCase: jest.fn(),
  createVendorUseCase: jest.fn(),
  createContractorUseCase: jest.fn(),
  createEmployerUseCase: jest.fn(),
  getCounterpartiesUseCase: jest.fn(),
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

const ENDPOINT = '/api/v1/counterparties';
const userId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
const accountingEntityId = '123e4567-e89b-12d3-a456-426614174002' as TEntityId;

const accountingEntity = {
  id: accountingEntityId,
  ownerId: userId,
  functionalCurrencyCode: 'NGN',
  jurisdictionCode: 'NG',
} as IAccountingEntity;

const mockResult = {
  data: [
    {
      id: 'cp-1',
      accountingEntityId,
      name: 'Acme Corp',
      status: 'active',
      type: 'organization',
      roles: ['vendor'],
      createdAt: new Date('2026-08-01T08:00:00.000Z'),
      updatedAt: new Date('2026-08-01T08:00:00.000Z'),
    },
  ],
  meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
};

describe('GET /counterparties', () => {
  let app: Express;
  const mockGetAuthUser = tokenService.getAuthUser as jest.Mock;
  const mockFindUser = userRepos.user.findById as jest.Mock;
  const mockFindAccountingEntity = accountingRepos.accountingEntity
    .findByIdAndUserId as jest.Mock;
  const mockGetCounterparties =
    counterpartyUseCases.getCounterpartiesUseCase as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthUser.mockResolvedValue({ id: userId });
    mockFindUser.mockResolvedValue({ id: userId } as IUser);
    mockFindAccountingEntity.mockResolvedValue(accountingEntity);
    mockGetCounterparties.mockResolvedValue(mockResult);
    app = createApplication();
  });

  const makeRequest = (query: object = {}) =>
    request(app)
      .get(ENDPOINT)
      .set('Authorization', 'Bearer valid-token')
      .set('x-accounting-entity-id', accountingEntityId)
      .query(query);

  describe('200 Response', () => {
    it('returns 200 with the counterparties pagination DTO', async () => {
      const response = await makeRequest({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.type).toBe('application/json');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toEqual({
        ...mockResult.data[0],
        createdAt: mockResult.data[0].createdAt.toISOString(),
        updatedAt: mockResult.data[0].updatedAt.toISOString(),
      });
      expect(mockGetCounterparties).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
        })
      );
    });
  });

  describe('400 Response', () => {
    it('rejects a missing active accounting entity header', async () => {
      const response = await request(app)
        .get(ENDPOINT)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.errorKey).toBe(
        'accounting_error_accounting_entity_unauthorized'
      );
      expect(mockGetCounterparties).not.toHaveBeenCalled();
    });
  });

  describe('401 Response', () => {
    it('rejects an unauthenticated request', async () => {
      const response = await request(app)
        .get(ENDPOINT)
        .set('x-accounting-entity-id', accountingEntityId);

      expect(response.status).toBe(401);
      expect(mockGetCounterparties).not.toHaveBeenCalled();
    });
  });

  describe('422 Response', () => {
    it('rejects invalid query formats (TSOA validation)', async () => {
      const response = await makeRequest({ limit: 'not-a-number' });

      expect(response.status).toBe(422);
      expect(response.body.errorKey).toBe('app_error_unprocessable');
      expect(mockGetCounterparties).not.toHaveBeenCalled();
    });

    it('returns 422 if usecase validation fails', async () => {
      const validationErrors = [{ field: 'limit', message: 'invalid_limit' }];
      mockGetCounterparties.mockRejectedValueOnce(
        new appError.UnprocessableEntity(validationErrors)
      );

      const response = await makeRequest();

      expect(response.status).toBe(422);
      expect(response.body.errorKey).toBe('app_error_unprocessable');
      expect(response.body.validationErrors).toEqual(validationErrors);
    });
  });

  describe('500 Response', () => {
    it('sanitizes unexpected internal errors', async () => {
      mockGetCounterparties.mockRejectedValueOnce(
        new Error('database failure')
      );

      const response = await makeRequest();

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        name: 'InternalServerError',
        errorKey: 'app_error_internal_server_error',
      });
    });
  });
});
