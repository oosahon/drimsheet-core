import { Express } from 'express';
import request from 'supertest';
import { IAccountingEntityCreationDto } from '../../../src/app/accounting/dtos/accounting/accounting.dto';
import authError from '../../../src/app/auth/errors/auth.error';
import periodError from '../../../src/domain/accounting/errors/period.error';
import { IAccountingEntity } from '../../../src/domain/accounting/types/accounting-entity.types';
import { IUser } from '../../../src/domain/user/types/user.types';
import authService from '../../../src/infra/ioc/services/auth';
import accountingUsecases from '../../../src/infra/ioc/usecases/accounting';
import accountingRepos from '../../../src/infra/persistence/repos/accounting';
import userRepos from '../../../src/infra/persistence/repos/user';
import { createApplication } from '../../../src/infra/server';
import { TEntityId } from '../../../src/shared/types/uuid';
import appError from '../../../src/shared/values/errors/app.error';

jest.mock('../../../src/infra/ioc/services/auth', () => ({
  __esModule: true,
  default: {
    password: {},
    token: { getAuthUser: jest.fn() },
  },
}));

jest.mock('../../../src/infra/ioc/usecases/accounting', () => ({
  __esModule: true,
  default: {
    createAccountingEntity: jest.fn(),
    getJurisdictions: jest.fn(),
    getUserAccountingEntities: jest.fn(),
    getActiveAccountingEntity: jest.fn(),
  },
}));

jest.mock('../../../src/infra/persistence/repos/accounting', () => ({
  __esModule: true,
  default: {
    accountingEntity: {
      findByIdAndUserId: jest.fn(),
    },
  },
}));

jest.mock('../../../src/infra/persistence/repos/user', () => ({
  __esModule: true,
  default: {
    user: {
      findById: jest.fn(),
    },
  },
}));

const ENDPOINT = '/api/v1/accounting/accounting-entity';
const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
const maximumFiscalYearEndDate = new Date('2027-07-01T00:00:00.000Z');
const overLimitFiscalYearEndDate = new Date('2027-07-01T00:00:00.001Z');

const validPayload: IAccountingEntityCreationDto = {
  name: 'Ada Consulting',
  entityType: 'individual',
  jurisdictionCode: 'US',
  accountingStandardCode: 'US_GAAP',
  functionalCurrencyCode: 'USD',
  reportingCurrencyCode: 'USD',
  fiscalYear: {
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    endDate: new Date('2026-12-31T23:59:59.999Z'),
  },
  accountingPeriod: { unit: 'month', count: 12 },
  reportingPeriod: { unit: 'quarter', count: 4 },
  appUsageMode: 'non_power_user',
};

const createdEntity: IAccountingEntity = {
  id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
  name: validPayload.name,
  type: 'individual',
  ownerId: userId,
  functionalCurrencyCode: 'USD',
  jurisdictionCode: 'US',
  createdAt: new Date('2026-07-26T10:00:00.000Z'),
  updatedAt: new Date('2026-07-26T10:00:00.000Z'),
};

describe('POST /accounting/accounting-entity', () => {
  let app: Express;
  const mockGetAuthUser = authService.token.getAuthUser as jest.Mock;
  const mockFindUser = userRepos.user.findById as jest.Mock;
  const mockFindAccountingEntity = accountingRepos.accountingEntity
    .findByIdAndUserId as jest.Mock;
  const mockCreateAccountingEntity =
    accountingUsecases.createAccountingEntity as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthUser.mockResolvedValue({ id: userId });
    mockFindUser.mockResolvedValue({ id: userId } as IUser);
    mockFindAccountingEntity.mockResolvedValue(null);
    mockCreateAccountingEntity.mockResolvedValue(createdEntity);
    app = createApplication();
  });

  describe('201 Response', () => {
    it('returns the explicit entity contract with security headers', async () => {
      const response = await request(app)
        .post(ENDPOINT)
        .set('Authorization', 'Bearer valid-token')
        .send(validPayload);

      expect(response.status).toBe(201);
      expect(response.type).toBe('application/json');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.body).toEqual({
        ...createdEntity,
        createdAt: createdEntity.createdAt.toISOString(),
        updatedAt: createdEntity.updatedAt.toISOString(),
      });
      expect(mockCreateAccountingEntity).toHaveBeenCalledWith({
        ...validPayload,
      });
    });
  });

  describe('400 Response', () => {
    it('maps a jurisdiction fiscal year limit violation', async () => {
      const overLimitPayload = {
        ...validPayload,
        fiscalYear: {
          ...validPayload.fiscalYear,
          endDate: overLimitFiscalYearEndDate,
        },
      };

      mockCreateAccountingEntity.mockRejectedValue(
        new periodError.FiscalYearExceedsJurisdictionLimit({
          jurisdictionCode: validPayload.jurisdictionCode,
          maxFiscalMonths: 18,
          startDate: validPayload.fiscalYear.startDate,
          endDate: overLimitFiscalYearEndDate,
          maximumEndDate: maximumFiscalYearEndDate,
        })
      );

      const response = await request(app)
        .post(ENDPOINT)
        .set('Authorization', 'Bearer valid-token')
        .send(overLimitPayload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        name: 'PeriodError',
        errorKey:
          'accounting_error_period_fiscal_year_exceeds_jurisdiction_limit',
        cause: {
          jurisdictionCode: validPayload.jurisdictionCode,
          maxFiscalMonths: 18,
          startDate: validPayload.fiscalYear.startDate.toISOString(),
          endDate: overLimitFiscalYearEndDate.toISOString(),
          maximumEndDate: maximumFiscalYearEndDate.toISOString(),
        },
      });
      expect(mockCreateAccountingEntity).toHaveBeenCalledWith(overLimitPayload);
    });
  });

  describe('401 Response', () => {
    it.each([
      ['missing authorization', undefined],
      ['wrong authorization scheme', 'Basic token'],
      ['authorization with extra segments', 'Bearer token extra'],
    ])('rejects %s', async (_label, authorization) => {
      const requestBuilder = request(app).post(ENDPOINT).send(validPayload);
      if (authorization) requestBuilder.set('Authorization', authorization);

      const response = await requestBuilder;

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        name: 'Unauthorized',
        errorKey: 'app_error_unauthorized',
      });
      expect(mockCreateAccountingEntity).not.toHaveBeenCalled();
    });

    it('rejects a nonexistent user', async () => {
      mockFindUser.mockResolvedValue(null);

      const response = await request(app)
        .post(ENDPOINT)
        .set('Authorization', 'Bearer valid-token')
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(mockCreateAccountingEntity).not.toHaveBeenCalled();
    });

    it('rejects an expired bearer token', async () => {
      mockGetAuthUser.mockRejectedValue(new authError.ExpiredToken());

      const response = await request(app)
        .post(ENDPOINT)
        .set('Authorization', 'Bearer expired-token')
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        name: 'AuthError',
        errorKey: 'auth_error_expired_token',
      });
      expect(mockCreateAccountingEntity).not.toHaveBeenCalled();
    });
  });

  describe('403 Response', () => {
    it('rejects a caller-supplied foreign accounting entity context', async () => {
      mockFindAccountingEntity.mockResolvedValue({
        ...createdEntity,
        ownerId: '999e4567-e89b-12d3-a456-426614174999',
      });

      const response = await request(app)
        .post(ENDPOINT)
        .set('Authorization', 'Bearer valid-token')
        .set('x-accounting-entity-id', createdEntity.id)
        .send(validPayload);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        name: 'Forbidden',
        errorKey: 'app_error_forbidden',
      });
      expect(mockCreateAccountingEntity).not.toHaveBeenCalled();
    });
  });

  describe('409 Response', () => {
    it('maps accounting entity conflicts', async () => {
      mockCreateAccountingEntity.mockRejectedValue(new appError.Conflict());

      const response = await request(app)
        .post(ENDPOINT)
        .set('Authorization', 'Bearer valid-token')
        .send(validPayload);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        name: 'Conflict',
        errorKey: 'app_error_conflict',
      });
    });
  });

  describe('422 Response', () => {
    it.each([
      ['unsupported entity type', { entityType: 'partnership' }],
      ['unsupported jurisdiction', { jurisdictionCode: 'ZZ' }],
      [
        'unsupported accounting standard',
        { accountingStandardCode: 'INVALID' },
      ],
      ['unsupported currency', { functionalCurrencyCode: 'ZZZ' }],
      ['unsupported reporting currency', { reportingCurrencyCode: 'ZZZ' }],
      ['unsupported mode', { appUsageMode: 'expert' }],
      [
        'fractional period count',
        { accountingPeriod: { unit: 'month', count: 1.5 } },
      ],
      [
        'excessive period count',
        { accountingPeriod: { unit: 'day', count: 551 } },
      ],
      ['caller-supplied owner identity', { ownerId: userId }],
      [
        'malformed fiscal year date',
        {
          fiscalYear: {
            startDate: 'not-a-date',
            endDate: validPayload.fiscalYear.endDate,
          },
        },
      ],
    ])('rejects %s before orchestration', async (_label, override) => {
      const response = await request(app)
        .post(ENDPOINT)
        .set('Authorization', 'Bearer valid-token')
        .send({ ...validPayload, ...override });

      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({
        name: 'UnprocessableEntity',
        errorKey: 'app_error_unprocessable',
      });
      expect(mockCreateAccountingEntity).not.toHaveBeenCalled();
    });
  });

  describe('500 Response', () => {
    it('sanitizes unexpected creation failures', async () => {
      mockCreateAccountingEntity.mockRejectedValue(
        new Error('database credentials leaked')
      );

      const response = await request(app)
        .post(ENDPOINT)
        .set('Authorization', 'Bearer valid-token')
        .send(validPayload);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        name: 'InternalServerError',
        errorKey: 'app_error_internal_server_error',
      });
      expect(JSON.stringify(response.body)).not.toContain(
        'database credentials'
      );
    });
  });
});
