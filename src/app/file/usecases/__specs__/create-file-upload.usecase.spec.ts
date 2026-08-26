import appError from '@shared/values/errors/app.error';

import mockBlackblazeClient from '@app/file/contracts/__mocks__/blackblaze-client.mock';
import fileAppError from '@app/file/errors/file.error';
import makeCreateFileUploadUsecase from '@app/file/usecases/create-file-upload.usecase';

jest.mock('@shared/utils/uuid-generator', () => ({
  __esModule: true,
  default: jest.fn(() => '01991b77-8380-7000-8000-000000000001'),
}));

describe('createFileUploadUsecase', () => {
  const getUsecase = () =>
    makeCreateFileUploadUsecase({ blackblazeClient: mockBlackblazeClient });

  beforeEach(() => {
    jest.clearAllMocks();
    mockBlackblazeClient.createUpload.mockResolvedValue({
      uploadUrl: 'https://example.com/file?signature=secret',
      fileUrl: 'https://example.com/file',
      headers: Object.freeze({ 'Content-Type': 'image/png' }),
    });
  });

  it('creates an upload instruction with an opaque Core-owned key', async () => {
    const result = await getUsecase()({
      name: ' receipt.png ',
      type: ' image/png ',
      size: 1024,
    });

    expect(mockBlackblazeClient.createUpload).toHaveBeenCalledWith({
      key: 'files/01991b77-8380-7000-8000-000000000001',
      contentType: 'image/png',
    });
    expect(result).toEqual({
      uploadUrl: 'https://example.com/file?signature=secret',
      headers: { 'Content-Type': 'image/png' },
      file: {
        url: 'https://example.com/file',
        name: 'receipt.png',
        type: 'image/png',
        size: 1024,
      },
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.file)).toBe(true);
  });

  it.each([
    { name: '', type: 'image/png', size: 1024 },
    { name: 'receipt.png', type: '', size: 1024 },
    { name: 'receipt.png', type: 'image/png', size: 0 },
  ])('rejects invalid metadata before calling Blackblaze', async (payload) => {
    await expect(getUsecase()(payload)).rejects.toThrow(
      appError.UnprocessableEntity
    );
    expect(mockBlackblazeClient.createUpload).not.toHaveBeenCalled();
  });

  it('maps provider failures to the stable file upload error', async () => {
    mockBlackblazeClient.createUpload.mockRejectedValue(
      new Error('provider detail that must not escape')
    );

    await expect(
      getUsecase()({ name: 'receipt.png', type: 'image/png', size: 1024 })
    ).rejects.toThrow(fileAppError.UploadUnexpected);
  });

  it('preserves the stable file upload error returned by the adapter', async () => {
    const error = new fileAppError.UploadUnexpected();
    mockBlackblazeClient.createUpload.mockRejectedValue(error);

    await expect(
      getUsecase()({ name: 'receipt.png', type: 'image/png', size: 1024 })
    ).rejects.toBe(error);
  });

  it('maps an invalid provider object URL to the stable upload error', async () => {
    mockBlackblazeClient.createUpload.mockResolvedValue({
      uploadUrl: 'https://example.com/file?signature=secret',
      fileUrl: 'not-a-url',
      headers: Object.freeze({ 'Content-Type': 'image/png' }),
    });

    await expect(
      getUsecase()({ name: 'receipt.png', type: 'image/png', size: 1024 })
    ).rejects.toThrow(fileAppError.UploadUnexpected);
  });
});
