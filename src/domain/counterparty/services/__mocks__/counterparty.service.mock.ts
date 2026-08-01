import ICounterpartyService from '../../types/counterparty.service.types';

const counterparty: jest.Mocked<ICounterpartyService> = {
  create: jest.fn(),
  createVendor: jest.fn(),
  createContractor: jest.fn(),
  createEmployer: jest.fn(),
};

const mockCounterpartyDomainServices = Object.freeze({
  counterparty,
});

export default mockCounterpartyDomainServices;
