import { TEntityId } from '@shared/types/uuid';

import { IFileUploadDto } from '@app/file/dtos/file-upload/file-upload.dto';

export interface ICreateManagedFileUploadPayload {
  userId: TEntityId;
  name: string;
  type: string;
  size: number;
}

export default interface IFileManagementService {
  createUpload(
    payload: ICreateManagedFileUploadPayload
  ): Promise<IFileUploadDto>;
}
