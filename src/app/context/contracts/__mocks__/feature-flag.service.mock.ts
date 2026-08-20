import IFeatureFlagService from '@app/context/contracts/feature-flag.service.contract';

const mockFeatureFlagService: jest.Mocked<IFeatureFlagService> = {
  canAccessAlpha1: jest.fn(),
};

export default mockFeatureFlagService;
