import { Express } from 'express';
import request from 'supertest';
import { IPettyCashAccountCreationReq } from '../../../src/app/ledger/dtos/asset-account/asset-account.dto';
import { ILedgerAccountDto } from '../../../src/app/ledger/dtos/ledger-account/ledger-account.dto';
import periodError from '../../../src/domain/accounting/errors/period.error';
import { IAccountingEntity } from '../../../src/domain/accounting/types/accounting-entity.types';
import { IUser } from '../../../src/domain/user/types/user.types';
import { tokenService } from '../../../src/infra/ioc/services/auth';
import * as ledgerUseCases from '../../../src/infra/ioc/usecases/ledger';
import accountingRepos from '../../../src/infra/persistence/repos/accounting';
import userRepos from '../../../src/infra/persistence/repos/user';
import { createApplication } from '../../../src/infra/server';
import { TEntityId } from '../../../src/shared/types/uuid';

jest.mock('../../../src/infra/ioc/services/auth', () => ({
  __esModule: true,
  tokenService: { getAuthUser: jest.fn() },
}));

jest.mock('../../../src/infra/ioc/usecases/ledger', () => ({
  __esModule: true,
  getLedgerAccountsUseCase: jest.fn(),
  getLedgerAccountUseCase: jest.fn(),
  adjustLedgerAccountBalanceUseCase: jest.fn(),
  getAccountTransactionsUseCase: jest.fn(),
  createPettyCashAccountUseCase: jest.fn(),
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

const ENDPOINT = '/api/v1/ledger/asset/petty-cash';
const userId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
const accountingEntityId = '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
const accountId = '123e4567-e89b-12d3-a456-426614174003' as TEntityId;
const openingBalanceDate = new Date('2026-03-14T00:00:00.000Z');

const validPayload: IPettyCashAccountCreationReq = {
  name: 'Office Petty Cash',
  currencyCode: 'NGN',
  isControlAccount: false,
  controlAccountCode: '100000',
  openingBalance: {
    amount: { amount: 1000, currencyCode: 'NGN', isMinorUnit: true },
    exchangeRate: null,
    date: openingBalanceDate,
  },
};

const accountingEntity = {
  id: accountingEntityId,
  ownerId: userId,
  functionalCurrencyCode: 'NGN',
} as IAccountingEntity;

const createdAccount: ILedgerAccountDto = {
  id: accountId,
  code: '100001',
  materializedPath: '100000.100001',
  accountingEntityId,
  type: 'asset',
  normalBalance: 'debit',
  subType: 'cash_and_cash_equivalent',
  behavior: 'petty_cash',
  isControlAccount: false,
  controlAccountId: '123e4567-e89b-12d3-a456-426614174004' as TEntityId,
  name: validPayload.name,
  status: 'active',
  contraAccountRule: 'contra_permitted',
  adjunctAccountRule: 'adjunct_permitted',
  openingBalanceDate,
  createdBy: userId,
  createdAt: new Date('2026-03-14T01:00:00.000Z'),
  updatedAt: new Date('2026-03-14T01:00:00.000Z'),
  balance: {
    amount: 1000,
    currencyCode: 'NGN',
    isMinorUnit: true,
  },
  functionalBalance: {
    amount: 1000,
    currencyCode: 'NGN',
    isMinorUnit: true,
  },
};

describe('POST /ledger/asset/petty-cash', () => {
  let app: Express;
  const mockGetAuthUser = tokenService.getAuthUser as jest.Mock;
  const mockFindUser = userRepos.user.findById as jest.Mock;
  const mockFindAccountingEntity = accountingRepos.accountingEntity
    .findByIdAndUserId as jest.Mock;
  const mockCreatePettyCashAccount =
    ledgerUseCases.createPettyCashAccountUseCase as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthUser.mockResolvedValue({ id: userId });
    mockFindUser.mockResolvedValue({ id: userId } as IUser);
    mockFindAccountingEntity.mockResolvedValue(accountingEntity);
    mockCreatePettyCashAccount.mockResolvedValue(createdAccount);
    app = createApplication();
  });

  const makeRequest = (payload: object = validPayload) =>
    request(app)
      .post(ENDPOINT)
      .set('Authorization', 'Bearer valid-token')
      .set('x-accounting-entity-id', accountingEntityId)
      .send(payload);

  describe('201 Response', () => {
    it('returns the concrete account and coerces request dates', async () => {
      const response = await makeRequest();

      expect(response.status).toBe(201);
      expect(response.type).toBe('application/json');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.body).toEqual({
        ...createdAccount,
        openingBalanceDate: openingBalanceDate.toISOString(),
        createdAt: createdAccount.createdAt.toISOString(),
        updatedAt: createdAccount.updatedAt.toISOString(),
      });
      expect(mockCreatePettyCashAccount).toHaveBeenCalledWith({
        ...validPayload,
        openingBalance: {
          ...validPayload.openingBalance,
          date: openingBalanceDate,
        },
      });
    });
  });

  describe('400 Response', () => {
    it('rejects a missing active accounting entity before orchestration', async () => {
      const response = await request(app)
        .post(ENDPOINT)
        .set('Authorization', 'Bearer valid-token')
        .send(validPayload);

      expect(response.status).toBe(400);
      expect(response.body.errorKey).toBe(
        'accounting_error_accounting_entity_unauthorized'
      );
      expect(mockCreatePettyCashAccount).not.toHaveBeenCalled();
    });

    it('maps a known posting-period failure', async () => {
      mockCreatePettyCashAccount.mockRejectedValueOnce(
        new periodError.PostingPeriodNotOpen({
          accountingEntityId,
          postingDate: openingBalanceDate,
        })
      );

      const response = await makeRequest();

      expect(response.status).toBe(400);
      expect(response.body.errorKey).toBe(
        'accounting_error_period_posting_period_not_open'
      );
    });
  });

  describe('401 Response', () => {
    it('rejects an unauthenticated request before orchestration', async () => {
      const response = await request(app)
        .post(ENDPOINT)
        .set('x-accounting-entity-id', accountingEntityId)
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(mockCreatePettyCashAccount).not.toHaveBeenCalled();
    });
  });

  describe('422 Response', () => {
    it('rejects an invalid request before orchestration', async () => {
      const { currencyCode: _currencyCode, ...invalidPayload } = validPayload;
      const response = await makeRequest(invalidPayload);

      expect(response.status).toBe(422);
      expect(response.body.errorKey).toBe('app_error_unprocessable');
      expect(mockCreatePettyCashAccount).not.toHaveBeenCalled();
    });
  });

  describe('500 Response', () => {
    it('sanitizes unexpected orchestration failures', async () => {
      mockCreatePettyCashAccount.mockRejectedValueOnce(
        new Error('database password leaked')
      );

      const response = await makeRequest();

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        name: 'InternalServerError',
        errorKey: 'app_error_internal_server_error',
      });
      expect(JSON.stringify(response.body)).not.toContain('password leaked');
    });
  });
});
