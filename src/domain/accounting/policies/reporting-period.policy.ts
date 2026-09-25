import { IAuthorizationResource } from '@shared/types/authorization-resource.types';

export const EReportingPeriodAction = {
  Create: 'create',
  Read: 'read',
  Update: 'update',
} as const;

export type UReportingPeriodAction =
  (typeof EReportingPeriodAction)[keyof typeof EReportingPeriodAction];

type TReportingPeriodResource = IAuthorizationResource<UReportingPeriodAction>;

export const reportingPeriodResource = {
  name: 'reporting_period',
  permissions: [
    { action: EReportingPeriodAction.Create },
    { action: EReportingPeriodAction.Read },
    { action: EReportingPeriodAction.Update },
  ],
} as const satisfies TReportingPeriodResource;
