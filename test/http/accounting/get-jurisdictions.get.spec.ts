import { Express } from 'express';
import request from 'supertest';
import { SYSTEM_JURISDICTIONS } from '../../../src/domain/accounting/config/jurisdictions.config';
import * as accountingUsecases from '../../../src/infra/ioc/usecases/accounting';
import { createApplication } from '../../../src/infra/server';

jest.mock('../../../src/infra/ioc/usecases/accounting', () => ({
  __esModule: true,
  createAccountingEntityUseCase: jest.fn(),
  getJurisdictionsUseCase: jest.fn(),
  getUserAccountingEntitiesUseCase: jest.fn(),
  getActiveAccountingEntityUseCase: jest.fn(),
}));

const ENDPOINT = '/api/v1/accounting/jurisdictions';
const jurisdictions = Object.values(SYSTEM_JURISDICTIONS).map(
  (jurisdiction) => ({
    code: jurisdiction.code,
    name: jurisdiction.name,
    currencyCode: jurisdiction.currency.code,
    maxFiscalMonths: jurisdiction.maxFiscalMonths,
    accountingStandards: jurisdiction.accountingStandards,
  })
);

describe('GET /accounting/jurisdictions', () => {
  let app: Express;
  const mockGetJurisdictions =
    accountingUsecases.getJurisdictionsUseCase as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetJurisdictions.mockResolvedValue(jurisdictions);
    app = createApplication();
  });

  describe('200 Response', () => {
    it('returns the public jurisdiction contract with security headers', async () => {
      const response = await request(app).get(ENDPOINT);

      expect(response.status).toBe(200);
      expect(response.type).toBe('application/json');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.body).toEqual(jurisdictions);
      expect(mockGetJurisdictions).toHaveBeenCalledTimes(1);
    });
  });

  describe('500 Response', () => {
    it('sanitizes unexpected failures', async () => {
      mockGetJurisdictions.mockRejectedValue(
        new Error('internal configuration secret')
      );

      const response = await request(app).get(ENDPOINT);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        name: 'InternalServerError',
        errorKey: 'app_error_internal_server_error',
      });
      expect(JSON.stringify(response.body)).not.toContain('configuration');
    });
  });
});
