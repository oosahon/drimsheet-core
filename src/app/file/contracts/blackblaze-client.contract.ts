export interface ICreateBlackblazeUploadPayload {
  key: string;
  contentType: string;
}

export interface IBlackblazeUploadInstruction {
  uploadUrl: string;
  fileUrl: string;
  headers: Readonly<Record<string, string>>;
}

export default interface IBlackblazeClient {
  createUpload(
    payload: ICreateBlackblazeUploadPayload
  ): Promise<IBlackblazeUploadInstruction>;
}
