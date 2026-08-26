import { IFileAttachment } from '@shared/values/file-attachments/types/file-attachment.types';

export interface IFileUploadReq {
  name: string;
  type: string;
  size: number;
}

export interface IFileUploadDto {
  uploadUrl: string;
  headers: Readonly<Record<string, string>>;
  file: IFileAttachment;
}
