import { Request, Response } from 'express';

import mockReporter from '@shared/contracts/__mocks__/reporter.mock';
import IVarsConfig from '@shared/contracts/vars-config.contract';

import makeSignupRateLimitMiddlewares from '@interface/http/middlewares/signup-rate-limit.middleware';

describe('makeSignupRateLimitMiddlewares', () => {
  const vars = {
    JWT_SECRET_KEY: 'test-rate-limit-secret',
  } as IVarsConfig;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    { index: 0, scope: 'signup-ip', limit: 20, ip: '192.0.2.41' },
    { index: 1, scope: 'signup-account', limit: 5, ip: '192.0.2.42' },
  ] as const)(
    'reports bounded $scope facts without signup request identity',
    async ({ index, scope, limit, ip }) => {
      const limiter = makeSignupRateLimitMiddlewares(vars, mockReporter)[index];
      const req = {
        method: 'POST',
        originalUrl: '/signup?email=private@example.com',
        ip,
        body: { email: 'private@example.com' },
        headers: { 'user-agent': 'PrivateAgent' },
      } as unknown as Request;
      const res = { setHeader: jest.fn() } as unknown as Response;

      for (let attempt = 0; attempt <= limit; attempt += 1) {
        await limiter(req, res, jest.fn());
      }

      expect(mockReporter.reportAbuse).toHaveBeenCalledTimes(1);
      expect(mockReporter.reportAbuse).toHaveBeenCalledWith(
        'Too many requests to API',
        {
          method: 'POST',
          scope,
          used: limit + 1,
          limit,
        }
      );
    }
  );
});
