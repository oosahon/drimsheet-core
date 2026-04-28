import accountingEntityEntity from '../entities/accounting-entity.entity';
import errors from '../errors';
import IAccountingEntityRepo from '../repos/accounting-entity.repo';
import IAccountingEntityService from '../types/accounting-entity.service.types';
import { EAccountingEntityType } from '../types/accounting-entity.types';

type TCreate = IAccountingEntityService['create'];
type TGrantUserAccess = IAccountingEntityService['grantUserAccess'];
type TValidateAccess = IAccountingEntityService['validateAccess'];

function makeCreate(repo: IAccountingEntityRepo): TCreate {
  return async (userId, payload, repoOptions) => {
    const existingEntities = await repo.findByUserId(
      userId,
      repoOptions,
      payload.type
    );

    const isDuplicateIndividual =
      payload.type === EAccountingEntityType.Individual &&
      existingEntities.length > 0;

    if (isDuplicateIndividual) {
      throw new errors.DuplicateAccountingEntity();
    }

    return accountingEntityEntity.make(payload);
  };
}

const grantUserAccess: TGrantUserAccess = (accountingEntity, userId) => {
  return accountingEntity.ownerId === userId;
};

const validateAccess: TValidateAccess = (accountingEntity, userId) => {
  if (!grantUserAccess(accountingEntity, userId)) {
    throw new errors.UnauthorizedUserAccess();
  }
};

export default function makeAccountingEntityService(
  repo: IAccountingEntityRepo
): IAccountingEntityService {
  return Object.freeze({
    create: makeCreate(repo),
    grantUserAccess,
    validateAccess,
  });
}
