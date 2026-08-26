import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';

import mockFileStorageClient from '@app/file/contracts/__mocks__/file-storage-client.mock';
import fileAppError from '@app/file/errors/file.error';
import makeFileManagementService from '@app/file/services/file-management.service';

jest.mock('@shared/utils/uuid-generator', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('FileManagementService', () => {
  const fileId = '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
  const userId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const mockedGenerateUUID = jest.mocked(generateUUID);

  const getService = () =>
    makeFileManagementService({ blackblazeClient: mockFileStorageClient });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGenerateUUID.mockReturnValue(fileId);
    mockFileStorageClient.createUpload.mockResolvedValue({
      uploadUrl: 'https://example.com/file?signature=secret',
      fileUrl: 'https://example.com/file',
      headers: Object.freeze({ 'Content-Type': 'image/png' }),
    });
  });

  it('creates a user-scoped upload and preserves the original filename', async () => {
    const result = await getService().createUpload({
      userId,
      name: '  Réçeipt (FINAL).png  ',
      type: ' image/png ',
      size: 1024,
    });

    expect(mockFileStorageClient.createUpload).toHaveBeenCalledWith({
      key: `${userId}/${fileId}`,
      contentType: 'image/png',
    });
    expect(result).toEqual({
      uploadUrl: 'https://example.com/file?signature=secret',
      headers: { 'Content-Type': 'image/png' },
      file: {
        url: 'https://example.com/file',
        name: '  Réçeipt (FINAL).png  ',
        type: 'image/png',
        size: 1024,
      },
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.file)).toBe(true);
  });

  it('uses the authenticated user as the first key segment', async () => {
    const anotherUserId = '123e4567-e89b-12d3-a456-426614174003' as TEntityId;

    await getService().createUpload({
      userId: anotherUserId,
      name: 'receipt.png',
      type: 'image/png',
      size: 1024,
    });

    expect(mockFileStorageClient.createUpload).toHaveBeenCalledWith(
      expect.objectContaining({ key: `${anotherUserId}/${fileId}` })
    );
  });

  it('uses different opaque keys for duplicate original filenames', async () => {
    const anotherFileId = '123e4567-e89b-12d3-a456-426614174004' as TEntityId;
    mockedGenerateUUID
      .mockReturnValueOnce(fileId)
      .mockReturnValueOnce(anotherFileId);
    const payload = {
      userId,
      name: 'receipt.png',
      type: 'image/png',
      size: 1024,
    };

    await getService().createUpload(payload);
    await getService().createUpload(payload);

    expect(mockFileStorageClient.createUpload).toHaveBeenNthCalledWith(1, {
      key: `${userId}/${fileId}`,
      contentType: 'image/png',
    });
    expect(mockFileStorageClient.createUpload).toHaveBeenNthCalledWith(2, {
      key: `${userId}/${anotherFileId}`,
      contentType: 'image/png',
    });
  });

  it('maps provider failures to the stable file upload error', async () => {
    mockFileStorageClient.createUpload.mockRejectedValue(
      new Error('provider detail that must not escape')
    );

    await expect(
      getService().createUpload({
        userId,
        name: 'receipt.png',
        type: 'image/png',
        size: 1024,
      })
    ).rejects.toThrow(fileAppError.UploadUnexpected);
  });

  it('maps file ID generation failures to the stable upload error', async () => {
    mockedGenerateUUID.mockImplementation(() => {
      throw new Error('UUID generation detail that must not escape');
    });

    await expect(
      getService().createUpload({
        userId,
        name: 'receipt.png',
        type: 'image/png',
        size: 1024,
      })
    ).rejects.toThrow(fileAppError.UploadUnexpected);
    expect(mockFileStorageClient.createUpload).not.toHaveBeenCalled();
  });

  it('preserves a stable file upload error returned by the adapter', async () => {
    const error = new fileAppError.UploadUnexpected();
    mockFileStorageClient.createUpload.mockRejectedValue(error);

    await expect(
      getService().createUpload({
        userId,
        name: 'receipt.png',
        type: 'image/png',
        size: 1024,
      })
    ).rejects.toBe(error);
  });

  it('maps invalid provider metadata to the stable upload error', async () => {
    mockFileStorageClient.createUpload.mockResolvedValue({
      uploadUrl: 'https://example.com/file?signature=secret',
      fileUrl: 'not-a-url',
      headers: Object.freeze({ 'Content-Type': 'image/png' }),
    });

    await expect(
      getService().createUpload({
        userId,
        name: 'receipt.png',
        type: 'image/png',
        size: 1024,
      })
    ).rejects.toThrow(fileAppError.UploadUnexpected);
  });
});
