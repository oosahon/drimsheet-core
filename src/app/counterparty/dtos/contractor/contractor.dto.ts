import { IAddressDto } from '../../../../shared/values/contact-details/dto/address.dto';
import { ICounterpartyCreateReq } from '../counterparty/counterparty.dto';

export interface IContractorCreateReq extends ICounterpartyCreateReq {
  address: IAddressDto;
}
