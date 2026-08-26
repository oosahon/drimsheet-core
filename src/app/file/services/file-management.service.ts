import generateUUID from '@shared/utils/uuid-generator';
import fileAttachmentValue from '@shared/values/file-attachments/file-attachment.vo';

import IBlackblazeClient from '@app/file/contracts/blackblaze-client.contract';
import IFileManagementService from '@app/file/contracts/file-management.service.contract';
import fileAppError from '@app/file/errors/file.error';

interface IDependencies {
  blackblazeClient: IBlackblazeClient;
}

export default function makeFileManagementService(
  deps: IDependencies
): IFileManagementService {
  return {
    async createUpload(payload) {
      try {
        const fileId = generateUUID();
        const contentType = payload.type.trim();
        const upload = await deps.blackblazeClient.createUpload({
          key: `${payload.userId}/${fileId}`,
          contentType,
        });
        const attachment = fileAttachmentValue.make({
          url: upload.fileUrl,
          name: payload.name,
          type: contentType,
          size: payload.size,
        });

        return Object.freeze({
          uploadUrl: upload.uploadUrl,
          headers: upload.headers,
          file: Object.freeze({
            url: attachment.url,
            name: attachment.name,
            type: attachment.type,
            size: attachment.size,
          }),
        });
      } catch (error) {
        if (error instanceof fileAppError.UploadUnexpected) throw error;
        throw new fileAppError.UploadUnexpected();
      }
    },
  };
}
