import errors from '../errors/accounting-entity.error';
import IAccountingEntityRepo from '../repos/accounting-entity.repo';
import IAccountingEntityService from '../types/accounting-entity.service.types';

type TGrantUserAccess = IAccountingEntityService['grantUserAccess'];
type TValidateAccess = IAccountingEntityService['validateAccess'];

export default function makeAccountingEntityService(
  repo: IAccountingEntityRepo
): IAccountingEntityService {
  /**
   * Grants a user access to an accounting entity
   * @param accountingEntity
   * @param userId
   * @returns boolean
   */
  const grantUserAccess: TGrantUserAccess = (accountingEntity, userId) => {
    return accountingEntity.ownerId === userId;
  };

  /**
   *
   * @param accountingEntity
   * @param userId
   * @throws {errors.UnauthorizedUserAccess}
   */
  const validateAccess: TValidateAccess = (accountingEntity, userId) => {
    if (!grantUserAccess(accountingEntity, userId)) {
      throw new errors.Unauthorized();
    }
  };

  return Object.freeze({
    grantUserAccess,
    validateAccess,
  });
}
