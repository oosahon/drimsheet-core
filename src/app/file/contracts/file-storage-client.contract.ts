export interface ICreateFileUploadPayload {
  key: string;
  contentType: string;
}

interface IFileUploadInstruction {
  uploadUrl: string;
  fileUrl: string;
  headers: Readonly<Record<string, string>>;
}

export default interface IFileStorageClient {
  createUpload(
    payload: ICreateFileUploadPayload
  ): Promise<IFileUploadInstruction>;
}
