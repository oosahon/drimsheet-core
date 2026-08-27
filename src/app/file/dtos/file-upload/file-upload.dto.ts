import { IFileAttachment } from '@shared/values/file-attachments/types/file-attachment.types';

import { UFileUploadPurpose } from '@app/file/types/file.types';

export interface IFileUploadReq {
  name: string;
  type: string;
  size: number;
  purpose: UFileUploadPurpose;
}

export interface IFileUploadDto {
  uploadUrl: string;

  /**
   * Opaque server-issued handle used to associate this upload with a later
   * application request. It is not a file URL or cloud-storage object key.
   */
  reference: string;

  headers: Readonly<Record<string, string>>;
  file: IFileAttachment;
}
