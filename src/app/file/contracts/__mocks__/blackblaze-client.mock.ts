import IBlackblazeClient from '@app/file/contracts/blackblaze-client.contract';

const mockBlackblazeClient: jest.Mocked<IBlackblazeClient> = {
  createUpload: jest.fn(),
};

export default mockBlackblazeClient;
