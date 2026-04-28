import { IDiff } from './diff.types';
import { TEntityId } from './uuid';

export interface IAuditTrail<T extends object> {
  userId: TEntityId;
  diff: IDiff<T>;
  createdAt: Date;
  action: string;
  note?: string | null;
}

export interface IMakeAuditTrail<T extends object, A extends IAuditTrail<T>> {
  previous: T | null;
  current: T;
  action: A['action'];
  note: A['note'];
  userId: A['userId'];
}
