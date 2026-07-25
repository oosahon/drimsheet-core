import { Express } from 'express';
import request from 'supertest';
import { IEmailLoginReq } from '../../../src/app/auth/dtos/auth/auth.dto';
import authError from '../../../src/app/auth/errors/auth.error';
import authUseCase from '../../../src/infra/ioc/usecases/auth.usecases';
import { createApplication } from '../../../src/infra/server';
import appError from '../../../src/shared/errors/app.error';

const ENDPOINT = '/api/v1/auth/login-with-email';

const validPayload: IEmailLoginReq = {
  email: 'ada@example.com',
  password: 'AnalyticalEngine1!',
};

describe('POST /auth/login-with-email', () => {
  let app: Express;
  let loginWithEmailSpy: jest.SpiedFunction<typeof authUseCase.loginWithEmail>;

  beforeEach(() => {
    loginWithEmailSpy = jest
      .spyOn(authUseCase, 'loginWithEmail')
      .mockResolvedValue({ accessToken: 'mock-access-token' });
    app = createApplication();
  });

  afterEach(() => {
    loginWithEmailSpy.mockRestore();
  });

  describe('200', () => {
    it('returns an uncached access token without leaking the password', async () => {
      const response = await request(app).post(ENDPOINT).send(validPayload);

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toContain('no-store');
      expect(response.body).toEqual({ accessToken: 'mock-access-token' });
      expect(JSON.stringify(response.body)).not.toContain(
        validPayload.password
      );
      expect(loginWithEmailSpy).toHaveBeenCalledWith(validPayload);
    });
  });

  describe('401', () => {
    it('returns the invalid-credentials response for login failures', async () => {
      loginWithEmailSpy.mockRejectedValueOnce(
        new authError.InvalidCredentials()
      );

      const response = await request(app)
        .post(ENDPOINT)
        .send({
          ...validPayload,
          email: 'invalid-credentials@example.com',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        name: 'AuthError',
        errorKey: 'auth_error_invalid_credentials',
      });
      expect(JSON.stringify(response.body)).not.toContain(
        validPayload.password
      );
    });
  });

  describe('422', () => {
    it('rejects a missing password before invoking the use case', async () => {
      const response = await request(app)
        .post(ENDPOINT)
        .send({ email: validPayload.email });

      expect(response.status).toBe(422);
      expect(response.body.validationErrors).toEqual([
        {
          field: 'body.password',
          message: "'password' is required",
        },
      ]);
      expect(loginWithEmailSpy).not.toHaveBeenCalled();
    });

    it('returns a sanitized app-layer validation error', async () => {
      loginWithEmailSpy.mockRejectedValueOnce(
        new appError.UnprocessableEntity([
          { field: 'email', message: 'auth_error_invalid_email' },
        ])
      );

      const response = await request(app)
        .post(ENDPOINT)
        .send({ ...validPayload, email: 'validation-error@example.com' });

      expect(response.status).toBe(422);
      expect(JSON.stringify(response.body)).not.toContain(
        validPayload.password
      );
    });
  });

  describe('429', () => {
    it('limits repeated attempts for one account', async () => {
      const rateLimitedPayload = {
        ...validPayload,
        email: 'repeated-attempts@example.com',
      };
      const responses = [];
      for (let index = 0; index < 6; index += 1) {
        responses.push(
          await request(app).post(ENDPOINT).send(rateLimitedPayload)
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
          message: 'Too many authentication attempts, please try again later.',
        },
      });
      expect(loginWithEmailSpy).toHaveBeenCalledTimes(5);
    });

    it('shares a rate-limit bucket across normalized email variants', async () => {
      const variants = [
        'bucket@example.com',
        'BUCKET@example.com',
        ' bucket@example.com',
        'bucket@example.com ',
        '  BUCKET@EXAMPLE.COM  ',
        'bucket@example.com',
      ];

      const responses = [];
      for (const email of variants) {
        responses.push(
          await request(app)
            .post(ENDPOINT)
            .send({ ...validPayload, email })
        );
      }

      expect(responses.slice(0, 5).map(({ status }) => status)).toEqual([
        200, 200, 200, 200, 200,
      ]);
      expect(responses[5].status).toBe(429);
      expect(loginWithEmailSpy).toHaveBeenCalledTimes(5);
    });

    it('falls back to the IP bucket for malformed email variants', async () => {
      const responses = [];
      for (let index = 0; index < 6; index += 1) {
        responses.push(
          await request(app)
            .post(ENDPOINT)
            .send({ ...validPayload, email: `malformed-${index}` })
        );
      }

      expect(responses.slice(0, 5).map(({ status }) => status)).toEqual([
        200, 200, 200, 200, 200,
      ]);
      expect(responses[5].status).toBe(429);
      expect(loginWithEmailSpy).toHaveBeenCalledTimes(5);
    });
  });

  describe('500', () => {
    it('sanitizes unexpected errors', async () => {
      loginWithEmailSpy.mockRejectedValueOnce(
        new Error(`failed with ${validPayload.password}`)
      );

      const response = await request(app)
        .post(ENDPOINT)
        .send({ ...validPayload, email: 'unexpected-error@example.com' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        name: 'InternalServerError',
        errorKey: 'app_error_internal_server_error',
      });
      expect(JSON.stringify(response.body)).not.toContain(
        validPayload.password
      );
    });
  });
});
