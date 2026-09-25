import { IAuthorizationResource } from '@shared/types/authorization-resource.types';

export const EUserAction = {
  Create: 'create',
  Read: 'read',
  Update: 'update',
} as const;

export type UUserAction = (typeof EUserAction)[keyof typeof EUserAction];

type TUserResource = IAuthorizationResource<UUserAction>;

export const userResource = {
  name: 'user',
  permissions: [
    { action: EUserAction.Create },
    { action: EUserAction.Read },
    { action: EUserAction.Update },
  ],
} as const satisfies TUserResource;
