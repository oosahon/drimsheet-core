import { TEntityId } from '../../../shared/types/uuid';

export interface IAuthTokenPayload {
  id: TEntityId;
}

export default interface ITokenService {
  generateSignupToken(payload: IAuthTokenPayload): Promise<string>;
  verifySignupToken(token: string): Promise<IAuthTokenPayload>;
  claimSignupToken(token: string): Promise<IAuthTokenPayload>;
  finalizeSignupToken(id: string): Promise<void>;
  releaseSignupTokenClaim(id: string): Promise<void>;
  generateAccessToken(payload: IAuthTokenPayload): Promise<string>;
  generateRefreshToken(payload: IAuthTokenPayload): Promise<string>;
  verifyRefreshToken(token: string): IAuthTokenPayload;
  generatePasswordResetToken(payload: IAuthTokenPayload): Promise<string>;
  verifyPasswordResetToken(token: string): Promise<IAuthTokenPayload>;
  claimPasswordResetToken(token: string): Promise<IAuthTokenPayload>;
  finalizePasswordResetToken(id: string): Promise<void>;
  releasePasswordResetTokenClaim(id: string): Promise<void>;
  getAuthUser(token: string): Promise<IAuthTokenPayload>;
}
