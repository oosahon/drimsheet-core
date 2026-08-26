import IFileStorageClient from '@app/file/contracts/file-storage-client.contract';

const mockFileStorageClient: jest.Mocked<IFileStorageClient> = {
  createUpload: jest.fn(),
};

export default mockFileStorageClient;
