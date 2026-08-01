import { IAddressDto } from '../../../../shared/values/contact-details/dto/address.dto';
import { ICounterpartyCreateReq } from '../counterparty/counterparty.dto';

export interface IEmployerCreateReq extends ICounterpartyCreateReq {
  displayName?: string | null;
  address: IAddressDto;
}
