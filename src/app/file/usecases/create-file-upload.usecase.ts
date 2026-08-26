import generateUUID from '@shared/utils/uuid-generator';
import zodValidationRunner from '@shared/utils/zod-validation-runner';
import fileAttachmentValue from '@shared/values/file-attachments/file-attachment.vo';

import IBlackblazeClient from '@app/file/contracts/blackblaze-client.contract';
import {
  IFileUploadDto,
  IFileUploadReq,
} from '@app/file/dtos/file-upload/file-upload.dto';
import { fileUploadReqValidation } from '@app/file/dtos/file-upload/file-upload.dto.validation';
import fileAppError from '@app/file/errors/file.error';

interface IDependencies {
  blackblazeClient: IBlackblazeClient;
}

export default function makeCreateFileUploadUsecase(deps: IDependencies) {
  return async (payload: IFileUploadReq): Promise<IFileUploadDto> => {
    zodValidationRunner(fileUploadReqValidation, payload);

    const name = payload.name.trim();
    const contentType = payload.type.trim();

    try {
      const upload = await deps.blackblazeClient.createUpload({
        key: `files/${generateUUID()}`,
        contentType,
      });

      return Object.freeze({
        uploadUrl: upload.uploadUrl,
        headers: upload.headers,
        file: fileAttachmentValue.make({
          url: upload.fileUrl,
          name,
          type: contentType,
          size: payload.size,
        }),
      });
    } catch (error) {
      if (error instanceof fileAppError.UploadUnexpected) throw error;
      throw new fileAppError.UploadUnexpected();
    }
  };
}
