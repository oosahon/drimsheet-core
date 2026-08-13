import { Express } from 'express';
import request from 'supertest';

import { TEntityId } from '@shared/types/uuid';

import { IUserPreferences } from '@domain/user/types/user-preferences.types';
import { IUser } from '@domain/user/types/user.types';

import authError from '@app/auth/errors/auth.error';

import { tokenService } from '@infra/ioc/services/auth';
import userRepos from '@infra/persistence/repos/user';
import { createApplication } from '@infra/server';

jest.mock('../../../src/infra/ioc/services/auth', () => {
  return {
    __esModule: true,
    tokenService: {
      getAuthUser: jest.fn(),
    },
  };
});

jest.mock('../../../src/infra/persistence/repos/user', () => {
  return {
    __esModule: true,
    default: {
      user: {
        findById: jest.fn(),
      },
      userPreferences: {
        findById: jest.fn(),
      },
    },
  };
});

const ENDPOINT = '/api/v1/users/preferences';

describe('GET /users/preferences', () => {
  let app: Express;
  const mockGetAuthUser = tokenService.getAuthUser as jest.Mock;
  const mockFindUser = userRepos.user.findById as jest.Mock;
  const mockFindPreferences = userRepos.userPreferences.findById as jest.Mock;

  const mockUser: IUser = {
    id: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
    email: 'user@example.com',
    emailVerified: true,
    firstName: 'First',
    lastName: 'Last',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPreferences: IUserPreferences = {
    id: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
    appPreferences: {
      theme: 'dark',
      appUsageMode: 'power_user',
    },
    createdAt: new Date('2026-03-13T00:00:00.000Z'),
    updatedAt: new Date('2026-03-13T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApplication();
  });

  describe('200 Response', () => {
    it('returns preferences for an authenticated user with valid token', async () => {
      mockGetAuthUser.mockResolvedValue({ id: mockUser.id });
      mockFindUser.mockResolvedValue(mockUser);
      mockFindPreferences.mockResolvedValue(mockPreferences);

      const response = await request(app)
        .get(ENDPOINT)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: mockPreferences.id,
        appPreferences: mockPreferences.appPreferences,
        createdAt: mockPreferences.createdAt.toISOString(),
        updatedAt: mockPreferences.updatedAt.toISOString(),
      });
      expect(mockGetAuthUser).toHaveBeenCalledWith('valid-token');
      expect(mockFindUser).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(Object)
      );
      expect(mockFindPreferences).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(Object)
      );
    });
  });

  describe('401 Response', () => {
    it('rejects if Authorization header is missing', async () => {
      const response = await request(app).get(ENDPOINT);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        name: 'Unauthorized',
        errorKey: 'app_error_unauthorized',
      });
      expect(mockFindPreferences).not.toHaveBeenCalled();
    });

    it('rejects if Authorization header has a wrong scheme', async () => {
      const response = await request(app)
        .get(ENDPOINT)
        .set('Authorization', 'Basic token');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        name: 'Unauthorized',
        errorKey: 'app_error_unauthorized',
      });
      expect(mockFindPreferences).not.toHaveBeenCalled();
    });

    it('rejects if Authorization header has extra segments', async () => {
      const response = await request(app)
        .get(ENDPOINT)
        .set('Authorization', 'Bearer token extra');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        name: 'Unauthorized',
        errorKey: 'app_error_unauthorized',
      });
      expect(mockFindPreferences).not.toHaveBeenCalled();
    });

    it('rejects if the token is invalid or expired', async () => {
      mockGetAuthUser.mockRejectedValue(new authError.ExpiredToken());

      const response = await request(app)
        .get(ENDPOINT)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        name: 'AuthError',
        errorKey: 'auth_error_expired_token',
      });
      expect(mockFindPreferences).not.toHaveBeenCalled();
    });

    it('rejects if the user does not exist in repository', async () => {
      mockGetAuthUser.mockResolvedValue({ id: mockUser.id });
      mockFindUser.mockResolvedValue(null);

      const response = await request(app)
        .get(ENDPOINT)
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        name: 'Unauthorized',
        errorKey: 'app_error_unauthorized',
      });
      expect(mockFindPreferences).not.toHaveBeenCalled();
    });
  });

  describe('404 Response', () => {
    it('returns resource not found error if preferences row does not exist', async () => {
      mockGetAuthUser.mockResolvedValue({ id: mockUser.id });
      mockFindUser.mockResolvedValue(mockUser);
      mockFindPreferences.mockResolvedValue(null);

      const response = await request(app)
        .get(ENDPOINT)
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        name: 'ResourceNotFound',
        errorKey: 'app_error_resource_not_found',
      });
    });
  });

  describe('500 Response', () => {
    it('sanitizes internal errors and returns InternalServerError', async () => {
      mockGetAuthUser.mockResolvedValue({ id: mockUser.id });
      mockFindUser.mockResolvedValue(mockUser);
      mockFindPreferences.mockRejectedValue(new Error('Database breakdown'));

      const response = await request(app)
        .get(ENDPOINT)
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        name: 'InternalServerError',
        errorKey: 'app_error_internal_server_error',
      });
    });
  });
});
