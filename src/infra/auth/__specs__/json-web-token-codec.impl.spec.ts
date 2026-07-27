import { decode, sign } from 'jsonwebtoken';
import makeJsonWebTokenCodec from '../json-web-token-codec.impl';

describe('makeJsonWebTokenCodec', () => {
  const secret = 'test-secret';
  const tokenCodec = makeJsonWebTokenCodec({ secret });

  it('encodes and verifies a payload using the configured token options', () => {
    const token = tokenCodec.encode(
      { id: 'user-123' },
      { expiresInSeconds: 900, tokenId: 'token-123' }
    );

    expect(decode(token)).toMatchObject({
      id: 'user-123',
      jti: 'token-123',
    });
    expect(tokenCodec.verify<{ id: string }>(token)).toMatchObject({
      payload: { id: 'user-123' },
      valid: true,
    });
  });

  it('classifies expired tokens', () => {
    const token = tokenCodec.encode(
      { id: 'user-123' },
      { expiresInSeconds: -1 }
    );

    expect(tokenCodec.verify(token)).toEqual({
      reason: 'expired',
      valid: false,
    });
  });

  it('classifies tokens that are not active yet', () => {
    const token = sign({ id: 'user-123' }, secret, { notBefore: '1 hour' });

    expect(tokenCodec.verify(token)).toEqual({
      reason: 'not-active',
      valid: false,
    });
  });

  it('classifies malformed tokens', () => {
    expect(tokenCodec.verify('not.a.token')).toEqual({
      reason: 'malformed',
      valid: false,
    });
  });

  it('classifies unexpected verification failures', () => {
    const failingTokenCodec = makeJsonWebTokenCodec({
      secret,
      verifyToken: () => {
        throw new Error('unexpected verification failure');
      },
    });

    expect(failingTokenCodec.verify('token')).toEqual({
      reason: 'invalid',
      valid: false,
    });
  });
});
