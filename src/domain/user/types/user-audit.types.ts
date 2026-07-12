import { IEntityDelta, IHistory } from '../../../shared/types/history.types';
import { IUser } from './user.types';

export const EUserEntityActions = {
  Created: 'created',
  EmailVerified: 'email-verified',
  Updated: 'updated',
} as const;

export type UUserEntityActions =
  (typeof EUserEntityActions)[keyof typeof EUserEntityActions];

export interface IUserAudit extends IEntityDelta<IUser> {
  action: UUserEntityActions;
}

export interface IMakeUserAuditPayload {
  before: IUser | null;
  after: IUser;
  action: UUserEntityActions;
}

export interface IUserHistory extends IHistory<IUser> {}
