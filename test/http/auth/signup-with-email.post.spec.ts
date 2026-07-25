import { Express } from 'express';
import request from 'supertest';
import { IUserSignupReq } from '../../../src/app/auth/dtos/auth/auth.dto';
import authUseCase from '../../../src/infra/ioc/usecases/auth.usecases';
import { createApplication } from '../../../src/infra/server';

const ENDPOINT = '/api/v1/auth/signup-with-email';

const validPayload: IUserSignupReq = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  password: 'AnalyticalEngine1!',
};

describe('POST /auth/signup-with-email', () => {
  let app: Express;
  let signupWithEmailSpy: jest.SpiedFunction<
    typeof authUseCase.signupWithEmail
  >;

  beforeEach(() => {
    signupWithEmailSpy = jest
      .spyOn(authUseCase, 'signupWithEmail')
      .mockResolvedValue(undefined);
    app = createApplication();
  });

  afterEach(() => {
    signupWithEmailSpy.mockRestore();
  });

  describe('201', () => {
    it('returns the documented non-sensitive response for a new signup', async () => {
      const response = await request(app).post(ENDPOINT).send(validPayload);

      expect(response.status).toBe(201);
      expect(response.text).toBe('');
      expect(JSON.stringify(response.body)).not.toContain(
        validPayload.password
      );
      expect(response.body).not.toHaveProperty('accessToken');
      expect(response.body).not.toHaveProperty('id');
    });

    it('does not reveal whether the normalized email already exists', async () => {
      const newSignup = await request(app).post(ENDPOINT).send(validPayload);
      const duplicateSignup = await request(app)
        .post(ENDPOINT)
        .send({ ...validPayload, email: 'ADA@EXAMPLE.COM' });

      expect(duplicateSignup.status).toBe(newSignup.status);
      expect(duplicateSignup.text).toBe(newSignup.text);
    });
  });

  describe('422 Response', () => {
    it('rejects an invalid request shape before invoking the use case', async () => {
      const { password: _password, ...missingPassword } = validPayload;

      const response = await request(app).post(ENDPOINT).send(missingPassword);

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        name: 'UnprocessableEntity',
        errorKey: 'app_error_unprocessable',
        validationErrors: [
          {
            field: 'body.password',
            message: "'password' is required",
          },
        ],
      });
      expect(signupWithEmailSpy).not.toHaveBeenCalled();
    });
  });

  describe('429 Response', () => {
    it('shares an account bucket across email case and whitespace variants', async () => {
      const variants = [
        'rate-limit@example.com',
        'RATE-LIMIT@example.com',
        ' rate-limit@example.com',
        'rate-limit@example.com ',
        '  RATE-LIMIT@EXAMPLE.COM  ',
        'rate-limit@example.com',
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
        201, 201, 201, 201, 201,
      ]);
      expect(responses[5].status).toBe(429);
      expect(responses[5].body).toEqual({
        name: 'TooManyRequests',
        errorKey: 'app_error_too_many_requests',
        cause: {
          used: 6,
          limit: 5,
          message: 'Too many signup attempts, please try again later.',
        },
      });
      expect(signupWithEmailSpy).toHaveBeenCalledTimes(5);
    });

    it('falls back to the IP bucket when the account input is malformed', async () => {
      const responses = [];
      for (let index = 0; index < 6; index += 1) {
        responses.push(
          await request(app)
            .post(ENDPOINT)
            .send({ ...validPayload, email: `malformed-email-${index}` })
        );
      }

      expect(responses.slice(0, 5).map(({ status }) => status)).toEqual([
        201, 201, 201, 201, 201,
      ]);
      expect(responses[5].status).toBe(429);
      expect(signupWithEmailSpy).toHaveBeenCalledTimes(5);
    });

    it('protects the application by IP even when email addresses rotate', async () => {
      const responses = await Promise.all(
        Array.from({ length: 22 }, (_, index) =>
          request(app)
            .post(ENDPOINT)
            .send({
              ...validPayload,
              email: `rotating-account-${index}@example.com`,
            })
        )
      );

      expect(responses.filter(({ status }) => status === 201)).toHaveLength(20);
      expect(responses.filter(({ status }) => status === 429)).toHaveLength(2);
      expect(signupWithEmailSpy).toHaveBeenCalledTimes(20);
    });
  });

  describe('500 Response', () => {
    it('sanitizes unexpected errors', async () => {
      signupWithEmailSpy.mockRejectedValueOnce(
        new Error(`persistence failed for ${validPayload.password}`)
      );

      const response = await request(app)
        .post(ENDPOINT)
        .send({
          ...validPayload,
          email: 'unexpected-error@example.com',
        });

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
