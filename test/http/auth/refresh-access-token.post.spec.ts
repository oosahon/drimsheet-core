import { Express } from 'express';
import request from 'supertest';
import authUseCase from '../../../src/infra/ioc/usecases/auth.usecases';
import { createApplication } from '../../../src/infra/server';

describe('POST /api/v1/auth/refresh-access-token', () => {
  let app: Express;
  let refreshSpy: jest.SpiedFunction<typeof authUseCase.refreshAccessToken>;

  beforeEach(() => {
    refreshSpy = jest
      .spyOn(authUseCase, 'refreshAccessToken')
      .mockResolvedValue({ accessToken: 'new-refreshed-access-token' });
    app = createApplication();
  });

  afterEach(() => {
    refreshSpy.mockRestore();
  });

  describe('200 Response', () => {
    it('prevents caching the refreshed access token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-access-token')
        .set('Cookie', ['refresh_token=valid-refresh-token']);

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toContain('no-store');
      expect(response.body).toEqual({
        accessToken: 'new-refreshed-access-token',
      });
    });
  });
});
