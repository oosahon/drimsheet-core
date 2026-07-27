import ITokenCodec from '../token-codec.contract';

const mockTokenCodec: jest.Mocked<ITokenCodec> = {
  encode: jest.fn(),
  verify: jest.fn(),
};

export default mockTokenCodec;
