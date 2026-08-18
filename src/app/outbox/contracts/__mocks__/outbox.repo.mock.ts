import IOutboxRepo from '@app/outbox/contracts/outbox.repo.contract';

const mockOutboxRepo: jest.Mocked<IOutboxRepo> = {
  create: jest.fn(),
  findByIdAndType: jest.fn(),
  delete: jest.fn(),
};

export default mockOutboxRepo;
