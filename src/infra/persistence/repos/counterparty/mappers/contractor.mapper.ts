import { InferSelectModel } from 'drizzle-orm';
import { IContractor } from '../../../../../domain/counterparty/types/counterparty.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import { counterpartyContractorsInCore } from '../../../../config/drizzle/schema';
import { fromRepoDate, toRepoDate } from '../../../helpers/date.mapper';

export interface IContractorModel extends InferSelectModel<
  typeof counterpartyContractorsInCore
> {}

const contractorMapper = {
  toRepo(entity: IContractor): IContractorModel {
    return {
      counterpartyId: entity.counterPartyId,
      addressLine1: entity.address.line1,
      addressLine2: entity.address.line2,
      addressCity: entity.address.city,
      addressRegion: entity.address.region,
      addressPostalCode: entity.address.postalCode,
      addressCountryCode: entity.address.countryCode,
      createdAt: toRepoDate(entity.createdAt),
    };
  },

  toDomain(payload: IContractorModel): IContractor {
    return Object.freeze({
      counterPartyId: payload.counterpartyId as TEntityId,
      address: Object.freeze({
        line1: payload.addressLine1,
        line2: payload.addressLine2,
        city: payload.addressCity,
        region: payload.addressRegion,
        postalCode: payload.addressPostalCode,
        countryCode: payload.addressCountryCode,
      }),
      createdAt: fromRepoDate(payload.createdAt),
    });
  },
};

export default contractorMapper;
