import IPasswordService from '../password-service.contract';

const mockPasswordService: jest.Mocked<IPasswordService> = {
  makePassword: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
};

export default mockPasswordService;
