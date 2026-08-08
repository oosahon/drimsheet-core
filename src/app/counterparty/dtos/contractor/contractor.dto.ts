import { IAddressDto } from '@shared/values/contact-details/dto/address.dto';

import { ICounterpartyCreateReq } from '@app/counterparty/dtos/counterparty/counterparty.dto';

export interface IContractorCreateReq extends ICounterpartyCreateReq {
  address: IAddressDto;
}
