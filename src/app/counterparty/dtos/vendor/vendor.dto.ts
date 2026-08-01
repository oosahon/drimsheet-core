import { IAddressDto } from '../../../../shared/values/contact-details/dto/address.dto';
import { ICounterpartyCreateReq } from '../counterparty/counterparty.dto';

export interface IVendorCreateReq extends ICounterpartyCreateReq {
  address?: IAddressDto;
}
