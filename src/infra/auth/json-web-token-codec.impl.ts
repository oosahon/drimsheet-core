import {
  JsonWebTokenError,
  NotBeforeError,
  sign,
  TokenExpiredError,
  verify,
} from 'jsonwebtoken';

import ITokenCodec, {
  ITokenEncodingOptions,
} from '@shared/contracts/token-codec.contract';

interface IDependencies {
  secret: string;
  signToken?: typeof sign;
  verifyToken?: typeof verify;
}

export default function makeJsonWebTokenCodec(
  deps: IDependencies
): ITokenCodec {
  const signToken = deps.signToken ?? sign;
  const verifyToken = deps.verifyToken ?? verify;

  return Object.freeze({
    encode(payload: Record<string, unknown>, options: ITokenEncodingOptions) {
      return signToken(payload, deps.secret, {
        algorithm: 'HS256',
        expiresIn: options.expiresInSeconds,
        ...(options.tokenId ? { jwtid: options.tokenId } : {}),
      });
    },

    verify<TPayload>(token: string) {
      try {
        const payload = verifyToken(token, deps.secret, {
          algorithms: ['HS256'],
        }) as TPayload;

        return { payload, valid: true } as const;
      } catch (error) {
        if (error instanceof TokenExpiredError) {
          return { reason: 'expired', valid: false } as const;
        }
        if (error instanceof NotBeforeError) {
          return { reason: 'not-active', valid: false } as const;
        }
        if (error instanceof JsonWebTokenError) {
          return { reason: 'malformed', valid: false } as const;
        }

        return { reason: 'invalid', valid: false } as const;
      }
    },
  });
}
