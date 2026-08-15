import { Express } from 'express';
import request from 'supertest';

import { TEntityId } from '@shared/types/uuid';
import appError from '@shared/values/errors/app.error';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';
import { IUser } from '@domain/user/types/user.types';

import {
  ICounterpartyCreateReq,
  ICounterpartyDto,
} from '@app/counterparty/dtos/counterparty/counterparty.dto';

import { tokenService } from '@infra/ioc/services/auth';
import * as counterpartyUseCases from '@infra/ioc/usecases/counterparty';
import accountingRepos from '@infra/persistence/repos/accounting';
import userRepos from '@infra/persistence/repos/user';
import { createApplication } from '@infra/server';

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
const counterpartyId = '123e4567-e89b-12d3-a456-426614174003' as TEntityId;

const validPayload: ICounterpartyCreateReq = {
  name: 'Acme Corp',
  status: 'active',
  type: 'organization',
};

const accountingEntity = {
  id: accountingEntityId,
  ownerId: userId,
  functionalCurrencyCode: 'NGN',
  jurisdictionCode: 'NG',
} as IAccountingEntity;

const createdCounterparty: ICounterpartyDto = {
  id: counterpartyId,
  accountingEntityId,
  name: validPayload.name,
  status: validPayload.status,
  type: validPayload.type,
  roles: [],
  createdAt: new Date('2026-08-01T08:00:00.000Z'),
  updatedAt: new Date('2026-08-01T08:00:00.000Z'),
};

describe('POST /counterparties', () => {
  let app: Express;
  const mockGetAuthUser = tokenService.getAuthUser as jest.Mock;
  const mockFindUser = userRepos.user.findById as jest.Mock;
  const mockFindAccountingEntity = accountingRepos.accountingEntity
    .findByIdAndUserId as jest.Mock;
  const mockCreateCounterparty =
    counterpartyUseCases.createCounterpartyUseCase as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthUser.mockResolvedValue({ id: userId });
    mockFindUser.mockResolvedValue({ id: userId } as IUser);
    mockFindAccountingEntity.mockResolvedValue(accountingEntity);
    mockCreateCounterparty.mockResolvedValue(createdCounterparty);
    app = createApplication();
  });

  const makeRequest = (payload: object = validPayload) =>
    request(app)
      .post(ENDPOINT)
      .set('Authorization', 'Bearer valid-token')
      .set('x-accounting-entity-id', accountingEntityId)
      .send(payload);

  describe('201 Response', () => {
    it('returns 201 with the created counterparty DTO', async () => {
      const response = await makeRequest();

      expect(response.status).toBe(201);
      expect(response.type).toBe('application/json');
      expect(response.body).toEqual({
        ...createdCounterparty,
        createdAt: createdCounterparty.createdAt.toISOString(),
        updatedAt: createdCounterparty.updatedAt.toISOString(),
      });
      // The body in the controller is parsed as strings for Dates by TSOA,
      // but express parses it, and supertest gets the object.
      // The controller passes the parsed body (with converted Date objects) to the usecase.
      expect(mockCreateCounterparty).toHaveBeenCalledWith(
        expect.objectContaining({
          name: validPayload.name,
          status: validPayload.status,
          type: validPayload.type,
        })
      );
    });
  });

  describe('500 Response', () => {
    it('rejects a missing active accounting entity header', async () => {
      const response = await request(app)
        .post(ENDPOINT)
        .set('Authorization', 'Bearer valid-token')
        .send(validPayload);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        name: 'InternalServerError',
        errorKey: 'app_error_unexpected',
      });
      expect(mockCreateCounterparty).not.toHaveBeenCalled();
    });
  });

  describe('401 Response', () => {
    it('rejects an unauthenticated request', async () => {
      const response = await request(app)
        .post(ENDPOINT)
        .set('x-accounting-entity-id', accountingEntityId)
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(mockCreateCounterparty).not.toHaveBeenCalled();
    });
  });

  describe('422 Response', () => {
    it('rejects invalid payload with extra fields (TSOA validation)', async () => {
      const invalidPayload = {
        ...validPayload,
        extraField: 'not allowed',
      };
      const response = await makeRequest(invalidPayload);

      expect(response.status).toBe(422);
      expect(response.body.errorKey).toBe('app_error_validation_error');
      expect(mockCreateCounterparty).not.toHaveBeenCalled();
    });

    it('returns 422 if usecase validation fails (zod validation runner)', async () => {
      const validationErrors = [{ field: 'name', message: 'invalid_name' }];
      mockCreateCounterparty.mockRejectedValueOnce(
        new appError.UnprocessableEntity(validationErrors)
      );

      const response = await makeRequest();

      expect(response.status).toBe(422);
      expect(response.body.errorKey).toBe('app_error_validation_error');
      expect(response.body.validationErrors).toEqual(validationErrors);
    });
  });

  describe('500 Response', () => {
    it('sanitizes unexpected internal errors', async () => {
      mockCreateCounterparty.mockRejectedValueOnce(
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
