import { TEntityId } from '@shared/types/uuid';
import { IEntityDelta } from '@shared/values/history/types/history.types';

import counterpartyError from '@domain/counterparty/errors/counterparty.error';
import ICounterpartyRepo from '@domain/counterparty/repos/counterparty.repo';
import ICounterpartyService from '@domain/counterparty/types/counterparty.service.types';
import {
  ECounterpartyType,
  ICounterparty,
} from '@domain/counterparty/types/counterparty.types';

import ICounterpartyAppService, {
  ICounterpartyFindOrCreatePayload,
  ICounterpartyFindOrCreateRes,
} from '@app/counterparty/contracts/counterparty.service.contract';

interface IDependencies {
  counterpartyRepo: ICounterpartyRepo;
  counterpartyService: ICounterpartyService;
}

function getKey(input: ICounterpartyFindOrCreatePayload) {
  const obj = {
    id: input.id ?? '',
    name: input.name.trim(),
    type: input.type ?? ECounterpartyType.Individual,
  };

  return JSON.stringify(obj);
}

function makeFindOrCreate(
  deps: IDependencies
): ICounterpartyAppService['findOrCreate'] {
  return async (payload, accountingEntityId, createdBy, repoOptions) => {
    if (payload.id) {
      const counterparty = await deps.counterpartyRepo.findById(
        payload.id as TEntityId,
        accountingEntityId,
        repoOptions
      );

      if (!counterparty) {
        throw new counterpartyError.InvalidCounterpartyId({
          ...payload,
        });
      }

      return {
        new: false,
        data: [counterparty, [], {} as IEntityDelta<ICounterparty>],
      };
    }

    const counterparty = deps.counterpartyService.create({
      name: payload.name,
      accountingEntityId,
      createdBy,
      type: payload.type ?? ECounterpartyType.Individual,
    });

    return {
      new: true,
      data: counterparty,
    };
  };
}

function makeFindOrCreateMany(
  deps: IDependencies
): ICounterpartyAppService['findOrCreateMany'] {
  return async (payload, accountingEntityId, createdBy, repoOptions) => {
    const findOrCreate = makeFindOrCreate(deps);
    const counterparties: Map<string, ICounterpartyFindOrCreateRes> = new Map();

    for (const input of payload) {
      const key = getKey(input);

      if (counterparties.has(key)) continue;

      const counterparty = await findOrCreate(
        input,
        accountingEntityId,
        createdBy,
        repoOptions
      );

      counterparties.set(key, counterparty);
    }

    return counterparties;
  };
}

export default function makeCounterpartyAppService(deps: IDependencies) {
  const service: ICounterpartyAppService = {
    findOrCreate: makeFindOrCreate(deps),
    findOrCreateMany: makeFindOrCreateMany(deps),

    getFoundOrCreated(input, map) {
      return map.get(getKey(input));
    },
  };

  return Object.freeze(service);
}
