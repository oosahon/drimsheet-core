import { TEntityId } from '@shared/types/uuid';

import { UPeriodStatus } from './period.types';

export interface IFiscalYear {
  createdBy: TEntityId;
  id: TEntityId;
  name: string;
  status: UPeriodStatus;
  accountingEntityId: TEntityId;
  startDate: Date;
  endDate: Date;
  closedAt: Date | null;
  updatedAt: Date;
}
