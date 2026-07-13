import IAccountingEntityRepo from '../accounting-entity.repo';

const mockAccountingEntityRepo: jest.Mocked<IAccountingEntityRepo> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
};

export default mockAccountingEntityRepo;
