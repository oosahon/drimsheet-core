import ICounterpartyPersistenceService from '../persistence.service.contract';

const mockCounterpartyPersistenceService: jest.Mocked<ICounterpartyPersistenceService> =
  {
    create: jest.fn(),
    createVendor: jest.fn(),
    createContractor: jest.fn(),
    createEmployer: jest.fn(),
  };

export default mockCounterpartyPersistenceService;
