import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import IFileStorageClient, {
  ICreateFileUploadPayload,
} from '@app/file/contracts/file-storage-client.contract';
import fileAppError from '@app/file/errors/file.error';

import vars from '@infra/config/vars.config';

const UPLOAD_URL_EXPIRY_SECONDS = 5 * 60;

interface IBlackblazeConfig {
  appKeyId: string;
  appKey: string;
  bucketName: string;
  endpoint: string;
  region: string;
}

function getStableFileUrl(uploadUrl: string): string {
  const fileUrl = new URL(uploadUrl);
  fileUrl.search = '';
  fileUrl.hash = '';
  return fileUrl.toString();
}

export function makeBlackblazeClient(
  config: IBlackblazeConfig
): IFileStorageClient {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.appKeyId,
      secretAccessKey: config.appKey,
    },
  });

  return Object.freeze({
    async createUpload({ key, contentType }: ICreateFileUploadPayload) {
      try {
        const uploadUrl = await getSignedUrl(
          client,
          new PutObjectCommand({
            Bucket: config.bucketName,
            Key: key,
            ContentType: contentType,
          }),
          { expiresIn: UPLOAD_URL_EXPIRY_SECONDS }
        );

        return Object.freeze({
          uploadUrl,
          fileUrl: getStableFileUrl(uploadUrl),
          headers: Object.freeze({ 'Content-Type': contentType }),
        });
      } catch {
        throw new fileAppError.UploadUnexpected();
      }
    },
  });
}

let configuredClient: IFileStorageClient | undefined;

const blackblazeClient: IFileStorageClient = Object.freeze({
  createUpload(payload: ICreateFileUploadPayload) {
    configuredClient ??= makeBlackblazeClient({
      appKeyId: vars.B2_APP_KEY_ID,
      appKey: vars.B2_APP_KEY,
      bucketName: vars.B2_BUCKET_NAME,
      endpoint: vars.B2_S3_ENDPOINT,
      region: vars.B2_REGION,
    });

    return configuredClient.createUpload(payload);
  },
});

export default blackblazeClient;
