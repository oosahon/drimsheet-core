import { Express } from 'express';
import request from 'supertest';
import authError from '../../../src/app/auth/errors/auth.error';
import { IAccountingEntity } from '../../../src/domain/accounting/types/accounting-entity.types';
import { IUser } from '../../../src/domain/user/types/user.types';
import { tokenService } from '../../../src/infra/ioc/services/auth';
import * as accountingUsecases from '../../../src/infra/ioc/usecases/accounting';
import accountingRepos from '../../../src/infra/persistence/repos/accounting';
import userRepos from '../../../src/infra/persistence/repos/user';
import { createApplication } from '../../../src/infra/server';
import { TEntityId } from '../../../src/shared/types/uuid';

jest.mock('../../../src/infra/ioc/services/auth', () => ({
  __esModule: true,
  tokenService: { getAuthUser: jest.fn() },
}));

jest.mock('../../../src/infra/ioc/usecases/accounting', () => ({
  __esModule: true,
  createAccountingEntityUseCase: jest.fn(),
  getJurisdictionsUseCase: jest.fn(),
  getUserAccountingEntitiesUseCase: jest.fn(),
  getActiveAccountingEntityUseCase: jest.fn(),
}));

jest.mock('../../../src/infra/persistence/repos/accounting', () => ({
  __esModule: true,
  default: {
    accountingEntity: { findByIdAndUserId: jest.fn() },
  },
}));

jest.mock('../../../src/infra/persistence/repos/user', () => ({
  __esModule: true,
  default: { user: { findById: jest.fn() } },
}));

const ENDPOINT = '/api/v1/accounting/accounting-entities';
const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
const entity: IAccountingEntity = {
  id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
  ownerId: userId,
  name: 'Ada Consulting',
  type: 'individual',
  functionalCurrencyCode: 'USD',
  jurisdictionCode: 'US',
  createdAt: new Date('2026-07-26T10:00:00.000Z'),
  updatedAt: new Date('2026-07-26T10:00:00.000Z'),
};

describe('GET /accounting/accounting-entities', () => {
  let app: Express;
  const mockGetAuthUser = tokenService.getAuthUser as jest.Mock;
  const mockFindUser = userRepos.user.findById as jest.Mock;
  const mockFindEntity = accountingRepos.accountingEntity
    .findByIdAndUserId as jest.Mock;
  const mockGetEntities =
    accountingUsecases.getUserAccountingEntitiesUseCase as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthUser.mockResolvedValue({ id: userId });
    mockFindUser.mockResolvedValue({ id: userId } as IUser);
    mockFindEntity.mockResolvedValue(null);
    mockGetEntities.mockResolvedValue([entity]);
    app = createApplication();
  });

  describe('200 Response', () => {
    it('returns the authenticated user entity contract', async () => {
      const response = await request(app)
        .get(ENDPOINT)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.type).toBe('application/json');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.body).toEqual([
        {
          ...entity,
          createdAt: entity.createdAt.toISOString(),
          updatedAt: entity.updatedAt.toISOString(),
        },
      ]);
      expect(mockGetEntities).toHaveBeenCalledWith();
    });

    it('returns an empty list when the user has no entities', async () => {
      mockGetEntities.mockResolvedValue([]);

      const response = await request(app)
        .get(ENDPOINT)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('ignores caller-supplied user identifiers', async () => {
      const foreignUserId = '999e4567-e89b-12d3-a456-426614174999';

      const response = await request(app)
        .get(`${ENDPOINT}?userId=${foreignUserId}`)
        .set('Authorization', 'Bearer valid-token')
        .set('x-user-id', foreignUserId);

      expect(response.status).toBe(200);
      expect(mockGetEntities).toHaveBeenCalledWith();
    });

    it('does not disclose an inaccessible entity supplied as context', async () => {
      mockFindEntity.mockResolvedValue(null);

      const response = await request(app)
        .get(ENDPOINT)
        .set('Authorization', 'Bearer valid-token')
        .set('x-accounting-entity-id', entity.id);

      expect(response.status).toBe(200);
      expect(mockFindEntity).toHaveBeenCalledWith(
        entity.id,
        userId,
        expect.any(Object)
      );
      expect(mockGetEntities).toHaveBeenCalledTimes(1);
    });
  });

  describe('400 Response', () => {
    it('rejects a malformed accounting entity header before orchestration', async () => {
      const response = await request(app)
        .get(ENDPOINT)
        .set('Authorization', 'Bearer valid-token')
        .set('x-accounting-entity-id', 'not-a-uuid');

      expect(response.status).toBe(400);
      expect(mockGetEntities).not.toHaveBeenCalled();
    });
  });

  describe('401 Response', () => {
    it.each([
      ['missing authorization', undefined],
      ['wrong authorization scheme', 'Basic token'],
      ['authorization with extra segments', 'Bearer token extra'],
    ])('rejects %s', async (_label, authorization) => {
      const requestBuilder = request(app).get(ENDPOINT);
      if (authorization) requestBuilder.set('Authorization', authorization);

      const response = await requestBuilder;

      expect(response.status).toBe(401);
      expect(mockGetEntities).not.toHaveBeenCalled();
    });

    it('rejects an expired token', async () => {
      mockGetAuthUser.mockRejectedValue(new authError.ExpiredToken());

      const response = await request(app)
        .get(ENDPOINT)
        .set('Authorization', 'Bearer expired-token');

      expect(response.status).toBe(401);
      expect(mockGetEntities).not.toHaveBeenCalled();
    });

    it('rejects a nonexistent user', async () => {
      mockFindUser.mockResolvedValue(null);

      const response = await request(app)
        .get(ENDPOINT)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(401);
      expect(mockGetEntities).not.toHaveBeenCalled();
    });
  });

  describe('500 Response', () => {
    it('sanitizes unexpected failures', async () => {
      mockGetEntities.mockRejectedValue(new Error('database credentials'));

      const response = await request(app)
        .get(ENDPOINT)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        name: 'InternalServerError',
        errorKey: 'app_error_internal_server_error',
      });
      expect(JSON.stringify(response.body)).not.toContain('credentials');
    });
  });
});
