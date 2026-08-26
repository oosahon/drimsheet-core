import { TEntityId } from '@shared/types/uuid';
import appError from '@shared/values/errors/app.error';

import mockAppContext from '@app/context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '@app/context/contracts/app-context.contract';
import mockFileManagementService from '@app/file/contracts/__mocks__/file-management.service.mock';
import fileAppError from '@app/file/errors/file.error';
import makeCreateFileUploadUsecase from '@app/file/usecases/create-file-upload.usecase';

describe('createFileUploadUsecase', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const upload = Object.freeze({
    uploadUrl: 'https://example.com/file?signature=secret',
    headers: Object.freeze({ 'Content-Type': 'image/png' }),
    file: Object.freeze({
      url: 'https://example.com/file',
      name: ' receipt.png ',
      type: 'image/png',
      size: 1024,
    }),
  });

  const getUsecase = () =>
    makeCreateFileUploadUsecase({
      appContext: mockAppContext,
      fileManagementService: mockFileManagementService,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppContext.get.mockReturnValue({
      user: { id: userId },
    } as IAppContextData & Required<Pick<IAppContextData, 'user'>>);
    mockFileManagementService.createUpload.mockResolvedValue(upload);
  });

  it('delegates the exact metadata with the authenticated user ID', async () => {
    const payload = {
      name: ' receipt.png ',
      type: ' image/png ',
      size: 1024,
    };

    await expect(getUsecase()(payload)).resolves.toBe(upload);
    expect(mockAppContext.get).toHaveBeenCalledWith(['user']);
    expect(mockFileManagementService.createUpload).toHaveBeenCalledWith({
      userId,
      name: ' receipt.png ',
      type: ' image/png ',
      size: 1024,
    });
  });

  it.each([
    { name: '', type: 'image/png', size: 1024 },
    { name: 'receipt.png', type: '', size: 1024 },
    { name: 'receipt.png', type: 'image/png', size: 0 },
  ])(
    'rejects invalid metadata before resolving user context',
    async (payload) => {
      await expect(getUsecase()(payload)).rejects.toThrow(
        appError.UnprocessableEntity
      );
      expect(mockAppContext.get).not.toHaveBeenCalled();
      expect(mockFileManagementService.createUpload).not.toHaveBeenCalled();
    }
  );

  it('propagates file-management failures', async () => {
    const error = new fileAppError.UploadUnexpected();
    mockFileManagementService.createUpload.mockRejectedValue(error);

    await expect(
      getUsecase()({ name: 'receipt.png', type: 'image/png', size: 1024 })
    ).rejects.toBe(error);
  });
});
