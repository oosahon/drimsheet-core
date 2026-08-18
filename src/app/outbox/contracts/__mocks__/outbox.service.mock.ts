import IOutboxService from '@app/outbox/contracts/outbox.service.contract';

const mockOutboxService: jest.Mocked<IOutboxService> = {
  createBalancePropagation: jest.fn(),
};

export default mockOutboxService;
