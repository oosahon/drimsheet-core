import ICounterpartyHistoryRepo from '../counterparty-history.repo';

const mockCounterpartyHistoryRepo: jest.Mocked<ICounterpartyHistoryRepo> = {
  save: jest.fn(),
};

export default mockCounterpartyHistoryRepo;
