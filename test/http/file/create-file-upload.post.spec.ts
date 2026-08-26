import { Express } from 'express';
import request from 'supertest';

import { TEntityId } from '@shared/types/uuid';
import appError from '@shared/values/errors/app.error';

import { IUser } from '@domain/user/types/user.types';

import mockFeatureFlagService from '@app/context/contracts/__mocks__/feature-flag.service.mock';
import { IFileUploadDto } from '@app/file/dtos/file-upload/file-upload.dto';
import fileAppError from '@app/file/errors/file.error';

import { tokenService } from '@infra/ioc/services/auth';
import * as fileUseCases from '@infra/ioc/usecases/file';
import userRepos from '@infra/persistence/repos/user';
import { createApplication } from '@infra/server';

jest.mock(
  '@infra/integrations/launchdarkly/launchdarkly-feature-flag.service',
  () => ({
    __esModule: true,
    default: jest.requireActual<
      typeof import('@app/context/contracts/__mocks__/feature-flag.service.mock')
    >('@app/context/contracts/__mocks__/feature-flag.service.mock').default,
  })
);

jest.mock('../../../src/infra/ioc/services/auth', () => ({
  __esModule: true,
  tokenService: {
    getAuthUser: jest.fn(),
  },
}));

jest.mock('../../../src/infra/persistence/repos/user', () => ({
  __esModule: true,
  default: {
    user: {
      findById: jest.fn(),
    },
  },
}));

jest.mock('../../../src/infra/ioc/usecases/file', () => ({
  __esModule: true,
  createFileUploadUseCase: jest.fn(),
}));

const ENDPOINT = '/api/v1/files/upload';
const userId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
const payload = { name: 'receipt.png', type: 'image/png', size: 1024 };

const mockUser: IUser = {
  id: userId,
  email: 'user@example.com',
  emailVerified: true,
  firstName: 'First',
  lastName: 'Last',
  deletedAt: null,
  createdAt: new Date('2026-03-13T00:00:00.000Z'),
  updatedAt: new Date('2026-03-13T00:00:00.000Z'),
};

const upload: IFileUploadDto = {
  uploadUrl: 'https://example.com/file?signature=secret',
  headers: { 'Content-Type': 'image/png' },
  file: {
    url: 'https://example.com/file',
    name: 'receipt.png',
    type: 'image/png',
    size: 1024,
  },
};

describe('POST /files/upload', () => {
  let app: Express;
  const mockGetAuthUser = tokenService.getAuthUser as jest.Mock;
  const mockFindUser = userRepos.user.findById as jest.Mock;
  const mockCreateFileUpload =
    fileUseCases.createFileUploadUseCase as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthUser.mockResolvedValue({ id: userId });
    mockFindUser.mockResolvedValue(mockUser);
    mockCreateFileUpload.mockResolvedValue(upload);
    app = createApplication();
  });

  afterEach(() => {
    expect(mockFeatureFlagService.canAccessAlpha1).not.toHaveBeenCalled();
  });

  it('returns a direct upload instruction for an authenticated request', async () => {
    const response = await request(app)
      .post(ENDPOINT)
      .set('Authorization', 'Bearer valid-token')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.type).toBe('application/json');
    expect(response.body).toEqual(upload);
    expect(mockCreateFileUpload).toHaveBeenCalledWith(payload);
  });

  it('rejects an unauthenticated request', async () => {
    const response = await request(app).post(ENDPOINT).send(payload);

    expect(response.status).toBe(401);
    expect(mockCreateFileUpload).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON metadata before orchestration', async () => {
    const response = await request(app)
      .post(ENDPOINT)
      .set('Authorization', 'Bearer valid-token')
      .send({ name: 'receipt.png', size: 1024 });

    expect(response.status).toBe(422);
    expect(mockCreateFileUpload).not.toHaveBeenCalled();
  });

  it('returns usecase validation failures as 422 responses', async () => {
    mockCreateFileUpload.mockRejectedValue(
      new appError.UnprocessableEntity([
        { field: 'size', message: 'file_attachment_error_size_invalid' },
      ])
    );

    const response = await request(app)
      .post(ENDPOINT)
      .set('Authorization', 'Bearer valid-token')
      .send({ ...payload, size: 0 });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      name: 'UnprocessableEntity',
      errorKey: 'app_error_validation_error',
    });
  });

  it('returns the stable error when Blackblaze cannot create the instruction', async () => {
    mockCreateFileUpload.mockRejectedValue(new fileAppError.UploadUnexpected());

    const response = await request(app)
      .post(ENDPOINT)
      .set('Authorization', 'Bearer valid-token')
      .send(payload);

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      name: 'InternalServerError',
      errorKey: 'app_error_unexpected',
    });
  });

  it('does not accept multipart file uploads', async () => {
    const response = await request(app)
      .post(ENDPOINT)
      .set('Authorization', 'Bearer valid-token')
      .field('name', payload.name)
      .field('type', payload.type)
      .field('size', String(payload.size));

    expect(response.status).toBe(422);
    expect(mockCreateFileUpload).not.toHaveBeenCalled();
  });
});
