import { Express } from 'express';
import passport from 'passport';
import request from 'supertest';
import authUseCase from '../../../src/infra/ioc/usecases/auth.usecases';
import { createApplication } from '../../../src/infra/server';

class MockGoogleStrategy extends passport.Strategy {
  constructor() {
    super();
    this.name = 'google';
  }

  authenticate(this: any) {
    this.success({ id: 'user-123', email: 'test@example.com' });
  }
}

describe('OAuth Handoff Integration & Security Contract', () => {
  let app: Express;
  let handleGoogleCallbackSpy: jest.SpiedFunction<
    typeof authUseCase.oAuth.handleGoogleCallback
  >;

  beforeAll(() => {
    passport.use('google', new MockGoogleStrategy());
  });

  beforeEach(() => {
    handleGoogleCallbackSpy = jest
      .spyOn(authUseCase.oAuth, 'handleGoogleCallback')
      .mockResolvedValue('http://localhost:3000/auth/oauth-confirmation');
    app = createApplication();
  });

  afterEach(() => {
    handleGoogleCallbackSpy.mockRestore();
  });

  describe('GET /api/v1/auth/google', () => {
    it('sets an HTTP-only oauth_state cookie on initiation', async () => {
      const response = await request(app).get('/api/v1/auth/google');
      const cookies = response.get('Set-Cookie') || [];

      const stateCookie = cookies.find((c: string) =>
        c.startsWith('oauth_state=')
      );
      expect(stateCookie).toBeDefined();
      expect(stateCookie).toContain('HttpOnly');
      expect(stateCookie).toContain('Path=/api/v1/auth');
    });
  });

  describe('GET /api/v1/auth/google/callback', () => {
    it('rejects callback with 401 when oauth_state cookie or query state parameter is missing or mismatched', async () => {
      const response = await request(app)
        .get('/api/v1/auth/google/callback?state=invalid-state')
        .set('Cookie', ['oauth_state=expected-state']);

      expect(response.status).toBe(401);
      expect(handleGoogleCallbackSpy).not.toHaveBeenCalled();
    });

    it('validates state, consumes it, and redirects to clean URL without credential parameters', async () => {
      const response = await request(app)
        .get('/api/v1/auth/google/callback?state=matching-state-123')
        .set('Cookie', ['oauth_state=matching-state-123']);

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe(
        'http://localhost:3000/auth/oauth-confirmation'
      );
      expect(response.headers.location).not.toContain('access_token');
      expect(response.headers.location).not.toContain('refresh_token');
    });
  });

  describe('POST /api/v1/auth/refresh-access-token', () => {
    it('returns Cache-Control: no-store header on refresh access token response', async () => {
      const refreshSpy = jest
        .spyOn(authUseCase, 'refreshAccessToken')
        .mockResolvedValue({ accessToken: 'new-refreshed-access-token' });

      const response = await request(app)
        .post('/api/v1/auth/refresh-access-token')
        .set('Cookie', ['refresh_token=valid-refresh-token']);

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toContain('no-store');
      expect(response.body).toEqual({
        accessToken: 'new-refreshed-access-token',
      });

      refreshSpy.mockRestore();
    });
  });
});
