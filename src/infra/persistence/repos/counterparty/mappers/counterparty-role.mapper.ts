import { InferInsertModel } from 'drizzle-orm';
import { UCounterpartyRole } from '../../../../../domain/counterparty/types/counterparty.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import { counterpartyRolesInCore } from '../../../../config/drizzle/schema';

export type ICounterpartyRoleRepoModel = InferInsertModel<
  typeof counterpartyRolesInCore
>;

const counterpartyRoleMapper = {
  toRepo(
    counterpartyId: TEntityId,
    role: UCounterpartyRole
  ): ICounterpartyRoleRepoModel {
    return {
      counterpartyId,
      role,
    };
  },

  toRepoMany(
    counterpartyId: TEntityId,
    roles: UCounterpartyRole[]
  ): ICounterpartyRoleRepoModel[] {
    return roles.map((role) => this.toRepo(counterpartyId, role));
  },
};

export default counterpartyRoleMapper;
