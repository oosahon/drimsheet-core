import IFileManagementService from '@app/file/contracts/file-management.service.contract';

const mockFileManagementService: jest.Mocked<IFileManagementService> = {
  preSignUploads: jest.fn(),
  claimUploads: jest.fn(),
};

export default mockFileManagementService;
