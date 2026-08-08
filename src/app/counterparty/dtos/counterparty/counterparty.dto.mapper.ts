import { ICounterparty } from '@domain/counterparty/types/counterparty.types';

import { ICounterpartyDto } from './counterparty.dto';

const counterpartyDtoMapper = {
  toDto(counterparty: ICounterparty): ICounterpartyDto {
    return {
      id: counterparty.id,
      accountingEntityId: counterparty.accountingEntityId,
      name: counterparty.name,
      status: counterparty.status,
      type: counterparty.type,
      roles: [...counterparty.roles],
      createdAt: counterparty.createdAt,
      updatedAt: counterparty.updatedAt,
    };
  },
};

export default Object.freeze(counterpartyDtoMapper);
