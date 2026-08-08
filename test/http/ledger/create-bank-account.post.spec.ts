import { Express } from 'express';
import request from 'supertest';
import { IBankAccountCreationReq } from '../../../src/app/ledger/dtos/asset-account/asset-account.dto';
import { ILedgerAccountDto } from '../../../src/app/ledger/dtos/ledger-account/ledger-account.dto';
import periodError from '../../../src/domain/accounting/errors/period.error';
import { IAccountingEntity } from '../../../src/domain/accounting/types/accounting-entity.types';
import ledgerAccountError from '../../../src/domain/ledger/errors/ledger-account.error';
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
  getBanksUseCase: jest.fn(),
  getLedgerAccountsUseCase: jest.fn(),
  getLedgerAccountUseCase: jest.fn(),
  adjustLedgerAccountBalanceUseCase: jest.fn(),
  getAccountTransactionsUseCase: jest.fn(),
  createPettyCashAccountUseCase: jest.fn(),
  createBankAccountUseCase: jest.fn(),
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

const ENDPOINT = '/api/v1/accounts/asset/bank';
const userId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
const accountingEntityId = '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
const accountId = '123e4567-e89b-12d3-a456-426614174003' as TEntityId;

const validPayload: IBankAccountCreationReq = {
  name: 'Operating Bank Account',
  currencyCode: 'NGN',
  controlAccountCode: '100000',
  bankAccount: {
    bankName: 'First Bank of Nigeria',
    accountName: 'Company Operating Account',
    accountNumber: '0123456789',
  },
  openingBalance: null,
};

const accountingEntity = {
  id: accountingEntityId,
  ownerId: userId,
  functionalCurrencyCode: 'NGN',
  jurisdictionCode: 'NG',
} as IAccountingEntity;

const createdAccount: ILedgerAccountDto = {
  id: accountId,
  code: '100001',
  materializedPath: '100000.100001',
  accountingEntityId,
  type: 'asset',
  normalBalance: 'debit',
  subType: 'cash_and_cash_equivalent',
  behavior: 'bank',
  isControlAccount: false,
  controlAccountId: '123e4567-e89b-12d3-a456-426614174004' as TEntityId,
  name: validPayload.name,
  status: 'active',
  contraAccountRule: 'contra_permitted',
  adjunctAccountRule: 'adjunct_permitted',
  meta: {
    countryCode: 'NG',
    bankName: 'First Bank of Nigeria',
    accountName: 'Company Operating Account',
    accountNumber: '0123456789',
  },
  openingBalanceDate: null,
  createdBy: userId,
  createdAt: new Date('2026-03-14T01:00:00.000Z'),
  updatedAt: new Date('2026-03-14T01:00:00.000Z'),
  balance: {
    amount: 0,
    currencyCode: 'NGN',
    isMinorUnit: true,
  },
  functionalBalance: {
    amount: 0,
    currencyCode: 'NGN',
    isMinorUnit: true,
  },
};

describe('POST /accounts/asset/bank', () => {
  let app: Express;
  const mockGetAuthUser = tokenService.getAuthUser as jest.Mock;
  const mockFindUser = userRepos.user.findById as jest.Mock;
  const mockFindAccountingEntity = accountingRepos.accountingEntity
    .findByIdAndUserId as jest.Mock;
  const mockCreateBankAccount =
    ledgerUseCases.createBankAccountUseCase as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthUser.mockResolvedValue({ id: userId });
    mockFindUser.mockResolvedValue({ id: userId } as IUser);
    mockFindAccountingEntity.mockResolvedValue(accountingEntity);
    mockCreateBankAccount.mockResolvedValue(createdAccount);
    app = createApplication();
  });

  const makeRequest = (payload: object = validPayload) =>
    request(app)
      .post(ENDPOINT)
      .set('Authorization', 'Bearer valid-token')
      .set('x-accounting-entity-id', accountingEntityId)
      .send(payload);

  describe('201 Response', () => {
    it('returns 201 with the created bank account DTO', async () => {
      const response = await makeRequest();

      expect(response.status).toBe(201);
      expect(response.type).toBe('application/json');
      expect(response.body).toEqual({
        ...createdAccount,
        openingBalanceDate: null,
        createdAt: createdAccount.createdAt.toISOString(),
        updatedAt: createdAccount.updatedAt.toISOString(),
      });
      expect(mockCreateBankAccount).toHaveBeenCalledWith(validPayload);
    });
  });

  describe('400 Response', () => {
    it('rejects a missing active accounting entity header', async () => {
      const response = await request(app)
        .post(ENDPOINT)
        .set('Authorization', 'Bearer valid-token')
        .send(validPayload);

      expect(response.status).toBe(400);
      expect(response.body.errorKey).toBe(
        'accounting_error_accounting_entity_unauthorized'
      );
      expect(mockCreateBankAccount).not.toHaveBeenCalled();
    });

    it('maps a posting period failure', async () => {
      mockCreateBankAccount.mockRejectedValueOnce(
        new periodError.PostingPeriodNotOpen({
          accountingEntityId,
          postingDate: new Date('2026-03-14T00:00:00.000Z'),
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
    it('rejects an unauthenticated request', async () => {
      const response = await request(app)
        .post(ENDPOINT)
        .set('x-accounting-entity-id', accountingEntityId)
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(mockCreateBankAccount).not.toHaveBeenCalled();
    });
  });

  it('maps a duplicate bank account error to 400 bad request', async () => {
    mockCreateBankAccount.mockRejectedValueOnce(
      new ledgerAccountError.DuplicateBankAccount({
        bankName: validPayload.bankAccount.bankName,
        accountNumber: validPayload.bankAccount.accountNumber,
      })
    );

    const response = await makeRequest();

    expect(response.status).toBe(400);
    expect(response.body.errorKey).toBe(
      'ledger_error_asset_account_duplicate_bank_account'
    );
  });

  describe('422 Response', () => {
    it('rejects a missing control account code before orchestration', async () => {
      const { controlAccountCode: _controlAccountCode, ...invalidPayload } =
        validPayload;
      const response = await makeRequest(invalidPayload);

      expect(response.status).toBe(422);
      expect(response.body.errorKey).toBe('app_error_unprocessable');
      expect(mockCreateBankAccount).not.toHaveBeenCalled();
    });

    it('rejects invalid payload with extra fields', async () => {
      const invalidPayload = {
        ...validPayload,
        extraField: 'not allowed',
      };
      const response = await makeRequest(invalidPayload);

      expect(response.status).toBe(422);
      expect(response.body.errorKey).toBe('app_error_unprocessable');
      expect(mockCreateBankAccount).not.toHaveBeenCalled();
    });
  });

  describe('500 Response', () => {
    it('sanitizes internal errors', async () => {
      mockCreateBankAccount.mockRejectedValueOnce(
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
