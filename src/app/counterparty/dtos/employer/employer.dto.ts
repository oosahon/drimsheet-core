import { IAddressDto } from '@shared/values/contact-details/dto/address.dto';

import { ICounterpartyCreateReq } from '@app/counterparty/dtos/counterparty/counterparty.dto';

export interface IEmployerCreateReq extends ICounterpartyCreateReq {
  displayName?: string | null;
  address: IAddressDto;
}
