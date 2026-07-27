import { Express } from 'express';
import request from 'supertest';
import {
  makeHashedRateLimitKey,
  rateLimiter,
} from '../../../src/infra/config/rate-limiter.config';
import authUseCase from '../../../src/infra/ioc/usecases/auth';
import { createApplication } from '../../../src/infra/server';

const ENDPOINT = '/api/v1/auth/signup/complete';
let tokenSequence = 0;

describe('POST /auth/signup/complete', () => {
  let app: Express;
  let rateLimitToken: string;
  let verifyEmailSpy: jest.SpiedFunction<typeof authUseCase.verifyEmail>;

  beforeEach(async () => {
    tokenSequence += 1;
    rateLimitToken = `rate-limit-token-attempt-${tokenSequence}`;
    await rateLimiter.verifyEmail.resetKey(
      makeHashedRateLimitKey(
        'verify-email',
        rateLimitToken,
        process.env.JWT_SECRET_KEY || 'secret'
      )!
    );
    verifyEmailSpy = jest
      .spyOn(authUseCase, 'verifyEmail')
      .mockResolvedValue({ accessToken: 'mock-access-token' });
    app = createApplication();
  });

  afterEach(() => {
    verifyEmailSpy.mockRestore();
  });

  describe('200 Response', () => {
    it('returns an access token with Cache-Control no-store for valid verification', async () => {
      const response = await request(app)
        .post(ENDPOINT)
        .send({ token: 'valid.jwt.token' });

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toContain('no-store');
      expect(response.body).toEqual({ accessToken: 'mock-access-token' });
      expect(JSON.stringify(response.body)).not.toContain('valid.jwt.token');
      expect(verifyEmailSpy).toHaveBeenCalledWith('valid.jwt.token');
    });
  });

  describe('401 Response', () => {
    it('sanitizes invalid or expired token errors', async () => {
      const authErrorModule =
        require('../../../src/app/auth/errors/auth.error').default;
      verifyEmailSpy.mockRejectedValueOnce(new authErrorModule.InvalidToken());

      const response = await request(app)
        .post(ENDPOINT)
        .send({ token: 'expired.or.invalid.token' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        name: 'AuthError',
        errorKey: 'auth_error_invalid_token',
      });
      expect(JSON.stringify(response.body)).not.toContain(
        'expired.or.invalid.token'
      );
    });
  });

  describe('422 Response', () => {
    it('rejects an invalid request payload before invoking the use case', async () => {
      const response = await request(app).post(ENDPOINT).send({});

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        name: 'UnprocessableEntity',
        errorKey: 'app_error_unprocessable',
        validationErrors: [
          {
            field: 'payload.token',
            message: "'token' is required",
          },
        ],
      });
      expect(verifyEmailSpy).not.toHaveBeenCalled();
    });

    it('rejects a non-string token payload', async () => {
      const response = await request(app).post(ENDPOINT).send({ token: 12345 });

      expect(response.status).toBe(422);
      expect(verifyEmailSpy).not.toHaveBeenCalled();
    });
  });

  describe('429 Response', () => {
    it('enforces rate limiting on repeated verification attempts', async () => {
      const responses = [];
      for (let index = 0; index < 6; index += 1) {
        responses.push(
          await request(app).post(ENDPOINT).send({ token: rateLimitToken })
        );
      }

      expect(responses.slice(0, 5).map(({ status }) => status)).toEqual([
        200, 200, 200, 200, 200,
      ]);
      expect(responses[5].status).toBe(429);
      expect(responses[5].body).toEqual({
        name: 'TooManyRequests',
        errorKey: 'app_error_too_many_requests',
        cause: {
          used: 6,
          limit: 5,
          message: 'auth_error_too_many_requests',
        },
      });
    });
  });

  describe('500 Response', () => {
    it('sanitizes unexpected internal errors without leaking the token', async () => {
      verifyEmailSpy.mockRejectedValueOnce(
        new Error(
          'Database connection failed with secret token: secret-value-123'
        )
      );

      const response = await request(app)
        .post(ENDPOINT)
        .send({ token: 'secret-value-123' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        name: 'InternalServerError',
        errorKey: 'app_error_internal_server_error',
      });
      expect(JSON.stringify(response.body)).not.toContain('secret-value-123');
    });
  });
});
