import IAccountingEntityService from '../../../../domain/accounting/types/accounting-entity.service.types';

const accountingEntity: jest.Mocked<IAccountingEntityService> = {
  grantUserAccess: jest.fn(),
  validateAccess: jest.fn(),
};

const mockAccountingDomainServices = Object.freeze({
  accountingEntity,
});

export default mockAccountingDomainServices;
