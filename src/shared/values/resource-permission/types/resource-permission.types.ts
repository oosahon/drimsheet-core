import { TEntityId } from '@shared/types/uuid';

export interface IResourcePermissionDefinition {
  entityName: string;
  action: string;
}

export interface IResourcePermission extends IResourcePermissionDefinition {
  accountingEntity: TEntityId;
  state?: string;
}
