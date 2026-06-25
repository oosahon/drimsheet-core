import { IEntityDelta } from '../../../../shared/types/history.types';
import { IFxLot, IFxLotAcquisition } from './fx-lot.types';

export const EFxLotAuditAction = {
  Created: 'created',
  Acquired: 'acquired',
  Disposed: 'disposed',
  Closed: 'closed',
  Reopened: 'reopened',
} as const;

export type UFxLotAuditAction =
  (typeof EFxLotAuditAction)[keyof typeof EFxLotAuditAction];

export interface IFxLotAudit extends IEntityDelta<IFxLot> {
  action: UFxLotAuditAction;
}

export const EFxLotAcquisitionAuditAction = {
  Created: 'created',
} as const;

export type UFxLotAcquisitionAuditAction =
  (typeof EFxLotAcquisitionAuditAction)[keyof typeof EFxLotAcquisitionAuditAction];

export interface IFxLotAcquisitionAudit extends IEntityDelta<IFxLotAcquisition> {
  action: UFxLotAcquisitionAuditAction;
}
