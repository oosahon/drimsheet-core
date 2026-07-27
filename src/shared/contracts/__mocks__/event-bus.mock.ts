import IEventBus from '../event-bus.contract';

const mockEventBus = {
  publish: jest.fn(),
  subscribe: jest.fn(),
} as unknown as jest.Mocked<IEventBus>;

export default mockEventBus;
