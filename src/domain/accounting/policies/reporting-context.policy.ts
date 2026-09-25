import { IAuthorizationResource } from '@shared/types/authorization-resource.types';

export const EReportingContextAction = {
  Create: 'create',
  Read: 'read',
  Update: 'update',
} as const;

export type UReportingContextAction =
  (typeof EReportingContextAction)[keyof typeof EReportingContextAction];

type TReportingContextResource =
  IAuthorizationResource<UReportingContextAction>;

export const reportingContextResource = {
  name: 'reporting_context',
  permissions: [
    { action: EReportingContextAction.Create },
    { action: EReportingContextAction.Read },
    { action: EReportingContextAction.Update },
  ],
} as const satisfies TReportingContextResource;
