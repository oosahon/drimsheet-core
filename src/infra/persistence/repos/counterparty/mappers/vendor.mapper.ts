import { InferSelectModel } from 'drizzle-orm';
import { IVendor } from '../../../../../domain/counterparty/types/counterparty.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import { counterpartyVendorsInCore } from '../../../../config/drizzle/schema';
import { fromRepoDate, toRepoDate } from '../../../helpers/date.mapper';

export interface IVendorModel extends InferSelectModel<
  typeof counterpartyVendorsInCore
> {}

const vendorMapper = {
  toRepo(entity: IVendor): IVendorModel {
    return {
      counterpartyId: entity.counterpartyId,
      addressLine1: entity.address?.line1 ?? null,
      addressLine2: entity.address?.line2 ?? null,
      addressCity: entity.address?.city ?? null,
      addressRegion: entity.address?.region ?? null,
      addressPostalCode: entity.address?.postalCode ?? null,
      addressCountryCode: entity.address?.countryCode ?? null,
      createdAt: toRepoDate(entity.createdAt),
    };
  },

  toDomain(payload: IVendorModel): IVendor {
    const hasAddress =
      payload.addressLine1 !== null &&
      payload.addressCity !== null &&
      payload.addressCountryCode !== null;
    return Object.freeze({
      counterpartyId: payload.counterpartyId as TEntityId,
      address: hasAddress
        ? Object.freeze({
            line1: payload.addressLine1!,
            line2: payload.addressLine2,
            city: payload.addressCity!,
            region: payload.addressRegion,
            postalCode: payload.addressPostalCode,
            countryCode: payload.addressCountryCode!,
          })
        : null,
      createdAt: fromRepoDate(payload.createdAt),
    });
  },
};

export default vendorMapper;
