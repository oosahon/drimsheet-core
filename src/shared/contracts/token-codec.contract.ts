export type TTokenVerificationFailure =
  | 'expired'
  | 'malformed'
  | 'not-active'
  | 'invalid';

export type TTokenVerification<TPayload> =
  | { payload: TPayload; valid: true }
  | { reason: TTokenVerificationFailure; valid: false };

export interface ITokenEncodingOptions {
  expiresInSeconds: number;
  tokenId?: string;
}

export default interface ITokenCodec {
  encode(
    payload: Record<string, unknown>,
    options: ITokenEncodingOptions
  ): string;

  verify<TPayload>(token: string): TTokenVerification<TPayload>;
}
