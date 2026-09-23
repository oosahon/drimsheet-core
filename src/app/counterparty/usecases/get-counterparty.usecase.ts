import { TEntityId } from '@shared/types/uuid';
import stringUtils from '@shared/utils/string';
import appError from '@shared/values/errors/app.error';

import counterpartyError from '@domain/counterparty/errors/counterparty.error';
import ICounterpartyRepo from '@domain/counterparty/repos/counterparty.repo';

import IAppContext from '@app/context/contracts/app-context.contract';
import { ICounterpartyDto } from '@app/counterparty/dtos/counterparty/counterparty.dto';
import counterpartyDtoMapper from '@app/counterparty/dtos/counterparty/counterparty.dto.mapper';

interface IDependencies {
  appContext: IAppContext;
  counterpartyRepo: ICounterpartyRepo;
}

export default function makeGetCounterpartyUsecase(deps: IDependencies) {
  return async (id: string): Promise<ICounterpartyDto> => {
    stringUtils.validateUUID(id, counterpartyError.InvalidCounterpartyId);

    const { correlationId, accountingEntity } = deps.appContext.get([
      'accountingEntity',
    ]);

    const counterparty = await deps.counterpartyRepo.findById(
      id as TEntityId,
      accountingEntity.id,
      { correlationId }
    );

    if (!counterparty) {
      throw new appError.ResourceNotFound({ id });
    }

    return counterpartyDtoMapper.toDto(counterparty);
  };
}
