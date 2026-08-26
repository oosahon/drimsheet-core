import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import fileAppError from '@app/file/errors/file.error';

import blackblazeClient, {
  makeBlackblazeClient,
} from '@infra/integrations/blackblaze/blackblaze-client';

jest.mock('@infra/config/vars.config', () => ({
  __esModule: true,
  default: {
    B2_APP_KEY_ID: 'configured-key-id',
    B2_APP_KEY: 'configured-application-key',
    B2_BUCKET_NAME: 'configured-bucket',
    B2_S3_ENDPOINT: 'https://s3.us-west-004.backblazeb2.com',
    B2_REGION: 'us-west-004',
  },
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('blackblazeClient', () => {
  const config = {
    appKeyId: 'application-key-id',
    appKey: 'application-key',
    bucketName: 'drimsheet-files',
    endpoint: 'https://s3.us-west-004.backblazeb2.com',
    region: 'us-west-004',
  };
  const presign = jest.mocked(getSignedUrl);

  beforeEach(() => {
    jest.clearAllMocks();
    presign.mockResolvedValue(
      'https://s3.us-west-004.backblazeb2.com/drimsheet-files/files/id?X-Amz-Signature=secret'
    );
  });

  it('presigns one Blackblaze PutObject request', async () => {
    const client = makeBlackblazeClient(config);

    await expect(
      client.createUpload({ key: 'files/id', contentType: 'image/png' })
    ).resolves.toEqual({
      uploadUrl:
        'https://s3.us-west-004.backblazeb2.com/drimsheet-files/files/id?X-Amz-Signature=secret',
      fileUrl:
        'https://s3.us-west-004.backblazeb2.com/drimsheet-files/files/id',
      headers: { 'Content-Type': 'image/png' },
    });

    expect(presign).toHaveBeenCalledTimes(1);
    const [s3Client, command, options] = presign.mock.calls[0];
    expect(s3Client).toBeInstanceOf(S3Client);
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect((command as PutObjectCommand).input).toEqual({
      Bucket: 'drimsheet-files',
      Key: 'files/id',
      ContentType: 'image/png',
    });
    expect(options).toEqual({ expiresIn: 300 });
    await expect(s3Client.config.region()).resolves.toBe('us-west-004');
    await expect(s3Client.config.endpoint?.()).resolves.toMatchObject({
      hostname: 's3.us-west-004.backblazeb2.com',
      protocol: 'https:',
    });
  });

  it('reuses the configured client used by IoC', async () => {
    await blackblazeClient.createUpload({
      key: 'files/first',
      contentType: 'image/png',
    });
    await blackblazeClient.createUpload({
      key: 'files/second',
      contentType: 'image/jpeg',
    });

    expect(presign).toHaveBeenCalledTimes(2);
    expect((presign.mock.calls[0][1] as PutObjectCommand).input).toMatchObject({
      Bucket: 'configured-bucket',
      Key: 'files/first',
    });
    expect((presign.mock.calls[1][1] as PutObjectCommand).input).toMatchObject({
      Bucket: 'configured-bucket',
      Key: 'files/second',
    });
  });

  it('returns immutable headers and instruction metadata', async () => {
    const result = await makeBlackblazeClient(config).createUpload({
      key: 'files/id',
      contentType: 'image/png',
    });

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.headers)).toBe(true);
  });

  it('removes all expiring URL data from the stable file URL', async () => {
    presign.mockResolvedValue(
      'https://files.example.com/files/id?signature=secret#fragment'
    );

    await expect(
      makeBlackblazeClient(config).createUpload({
        key: 'files/id',
        contentType: 'image/png',
      })
    ).resolves.toMatchObject({ fileUrl: 'https://files.example.com/files/id' });
  });

  it('maps presigner failures without exposing provider details', async () => {
    presign.mockRejectedValue(
      new Error('https://example.com?X-Amz-Credential=sensitive')
    );

    await expect(
      makeBlackblazeClient(config).createUpload({
        key: 'files/id',
        contentType: 'image/png',
      })
    ).rejects.toEqual(new fileAppError.UploadUnexpected());
  });

  it('maps malformed signed URLs to the stable upload error', async () => {
    presign.mockResolvedValue('not-a-url');

    await expect(
      makeBlackblazeClient(config).createUpload({
        key: 'files/id',
        contentType: 'image/png',
      })
    ).rejects.toThrow(fileAppError.UploadUnexpected);
  });
});
