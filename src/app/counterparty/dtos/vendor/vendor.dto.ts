import { IAddressDto } from '@shared/values/contact-details/dto/address.dto';

import { ICounterpartyCreateReq } from '@app/counterparty/dtos/counterparty/counterparty.dto';

export interface IVendorCreateReq extends ICounterpartyCreateReq {
  address?: IAddressDto;
}
