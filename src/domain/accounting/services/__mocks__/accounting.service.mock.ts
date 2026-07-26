import IAccountingEntityService from '../../types/accounting-entity.service.types';

const accountingEntity: jest.Mocked<IAccountingEntityService> = {
  create: jest.fn(),
  grantUserAccess: jest.fn(),
  validateAccess: jest.fn(),
};

const mockAccountingDomainServices = Object.freeze({
  accountingEntity,
});

export default mockAccountingDomainServices;
