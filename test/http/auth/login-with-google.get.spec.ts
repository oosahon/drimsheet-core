import { Express } from 'express';
import passport from 'passport';
import request from 'supertest';

import { createApplication } from '@infra/server';

class RedirectGoogleStrategy extends passport.Strategy {
  name = 'google';

  authenticate(
    _req: Express.Request,
    options: { state: string; scope: string[] }
  ) {
    const params = new URLSearchParams({
      state: options.state,
      scope: options.scope.join(' '),
    });
    this.redirect(`https://accounts.google.test/oauth?${params}`);
  }
}

describe('GET /api/v1/auth/google', () => {
  let app: Express;

  beforeAll(() => {
    passport.use('google', new RedirectGoogleStrategy());
  });

  beforeEach(() => {
    app = createApplication();
  });

  afterAll(() => {
    passport.unuse('google');
  });

  describe('302 Response', () => {
    it('binds a high-entropy state cookie to the provider redirect', async () => {
      const response = await request(app).get('/api/v1/auth/google');
      const stateCookie = (response.get('Set-Cookie') || []).find((cookie) =>
        cookie.startsWith('oauth_state=')
      );
      const location = new URL(response.headers.location);
      const cookieState = stateCookie?.match(/^oauth_state=([^;]+)/)?.[1];

      expect(response.status).toBe(302);
      expect(location.origin).toBe('https://accounts.google.test');
      expect(location.searchParams.get('state')).toBe(cookieState);
      expect(cookieState).toMatch(/^[a-f0-9]{64}$/);
      expect(location.searchParams.get('scope')).toContain('profile');
      expect(location.searchParams.get('scope')).toContain('email');
      expect(stateCookie).toContain('HttpOnly');
      expect(stateCookie).toContain('SameSite=Lax');
      expect(stateCookie).toContain('Path=/api/v1/auth');
      expect(stateCookie).toContain('Max-Age=600');
      expect(response.headers['cache-control']).toContain('no-store');
    });
  });
});
