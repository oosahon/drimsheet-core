import ITokenCodec from '@shared/contracts/token-codec.contract';

const mockTokenCodec: jest.Mocked<ITokenCodec> = {
  encode: jest.fn(),
  verify: jest.fn(),
};

export default mockTokenCodec;
