import { IResourcePermission } from '@shared/values/resource-permission/types/resource-permission.types';

function make(permission: IResourcePermission): string {
  const action =
    permission.state === undefined
      ? permission.action
      : `${permission.action}:${permission.state}`;

  return `${permission.accountingEntity}::${permission.entityName}::${action}`;
}

const resourcePermissionValue = Object.freeze({ make });

export default resourcePermissionValue;
