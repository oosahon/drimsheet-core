import { Express } from 'express';
import request from 'supertest';
import { IRequestPasswordResetReq } from '../../../src/app/auth/dtos/auth/auth.dto';
import {
  makeIpRateLimitKey,
  rateLimiter,
} from '../../../src/infra/config/rate-limiter.config';
import authUseCase from '../../../src/infra/ioc/usecases/auth';
import { createApplication } from '../../../src/infra/server';

import appError from '../../../src/shared/errors/app.error';

const ENDPOINT = '/api/v1/auth/get-password-reset-link';

describe('POST /auth/get-password-reset-link', () => {
  let app: Express;
  let getPasswordResetLinkSpy: jest.SpiedFunction<
    typeof authUseCase.getPasswordResetLink
  >;

  beforeEach(async () => {
    getPasswordResetLinkSpy = jest
      .spyOn(authUseCase, 'getPasswordResetLink')
      .mockResolvedValue(undefined);
    await rateLimiter.getPasswordResetLinkByIp.resetKey(
      makeIpRateLimitKey('::ffff:127.0.0.1')
    );
    app = createApplication();
  });

  afterEach(() => {
    getPasswordResetLinkSpy.mockRestore();
  });

  describe('200 Response', () => {
    it('sends password reset link, returns 200 OK, and sets Cache-Control no-store header', async () => {
      const payload: IRequestPasswordResetReq = {
        email: 'success@example.com',
      };
      const response = await request(app).post(ENDPOINT).send(payload);

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toContain('no-store');
      expect(response.body).toEqual({});
      expect(getPasswordResetLinkSpy).toHaveBeenCalledWith(
        'success@example.com'
      );
    });
  });

  describe('422 Response', () => {
    it('rejects missing email field before invoking use case', async () => {
      const response = await request(app).post(ENDPOINT).send({});

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        name: 'UnprocessableEntity',
        errorKey: 'app_error_unprocessable',
        validationErrors: [
          {
            field: 'payload.email',
            message: "'email' is required",
          },
        ],
      });
      expect(getPasswordResetLinkSpy).not.toHaveBeenCalled();
    });

    it('sanitizes application validation failures', async () => {
      getPasswordResetLinkSpy.mockRejectedValueOnce(
        new appError.UnprocessableEntity([
          { field: 'email', message: 'auth_error_invalid_email' },
        ])
      );

      const response = await request(app)
        .post(ENDPOINT)
        .send({ email: 'validation-error@example.com' });

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        name: 'UnprocessableEntity',
        errorKey: 'app_error_unprocessable',
        validationErrors: [
          {
            field: 'email',
            message: 'auth_error_invalid_email',
          },
        ],
      });
      expect(getPasswordResetLinkSpy).toHaveBeenCalledWith(
        'validation-error@example.com'
      );
    });
  });

  describe('429 Response', () => {
    it('limits repeated attempts for the same email', async () => {
      const payload = { email: 'rate-limit-account@example.com' };
      const responses = [];
      for (let index = 0; index < 6; index += 1) {
        responses.push(await request(app).post(ENDPOINT).send(payload));
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
      expect(getPasswordResetLinkSpy).toHaveBeenCalledTimes(5);
    });

    it('limits rotating email requests by IP', async () => {
      const responses = [];
      for (let index = 0; index < 21; index += 1) {
        responses.push(
          await request(app)
            .post(ENDPOINT)
            .send({ email: `rotating-email-${index}@example.com` })
        );
      }

      expect(responses.slice(0, 20).every(({ status }) => status === 200)).toBe(
        true
      );
      expect(responses[20].status).toBe(429);
      expect(getPasswordResetLinkSpy).toHaveBeenCalledTimes(20);
    });
  });

  describe('500 Response', () => {
    it('sanitizes unexpected errors without leaking the email', async () => {
      const payload = { email: 'unexpected-error@example.com' };
      getPasswordResetLinkSpy.mockRejectedValueOnce(
        new Error(`Database lookup failed for email ${payload.email}`)
      );

      const response = await request(app).post(ENDPOINT).send(payload);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        name: 'InternalServerError',
        errorKey: 'app_error_internal_server_error',
      });
      expect(JSON.stringify(response.body)).not.toContain(
        'unexpected-error@example.com'
      );
      expect(JSON.stringify(response.body)).not.toContain(
        'Database lookup failed'
      );
    });
  });
});
