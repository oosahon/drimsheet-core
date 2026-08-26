import IFileManagementService from '@app/file/contracts/file-management.service.contract';

const mockFileManagementService: jest.Mocked<IFileManagementService> = {
  createUpload: jest.fn(),
};

export default mockFileManagementService;
