import { TEntityId } from '../../../shared/types/uuid';

export interface IAuthTokenPayload {
  id: TEntityId;
}

export default interface ITokenService {
  generateSignupToken(payload: IAuthTokenPayload): Promise<string>;
  verifySignupToken(token: string): Promise<IAuthTokenPayload>;
  generateAccessToken(payload: IAuthTokenPayload): Promise<string>;
  generateRefreshToken(payload: IAuthTokenPayload): Promise<string>;
  verifyRefreshToken(token: string): IAuthTokenPayload;
  generatePasswordResetToken(payload: IAuthTokenPayload): Promise<string>;
  verifyPasswordResetToken(token: string): Promise<IAuthTokenPayload>;
  getAuthUser(token: string): Promise<IAuthTokenPayload>;
}
