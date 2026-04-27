import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import generateDiff from '../../../shared/utils/diff-generator';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import ledgerAccountEntity from '../../ledger/entities/shared/ledger-account.entity';
import categoryEvents from '../events/category.events';
import { ICategory, ICategoryHistory } from '../types/category.types';
import helpers from './helpers/category.entity.helpers';

interface IMakeHistoryLogPayload extends Pick<
  ICategoryHistory,
  'action' | 'userId' | 'note'
> {
  previous?: ICategory | null;
  current: ICategory;
}

function make(
  payload: TCreationOmits<ICategory, 'version'>
): TEntityWithEvents<ICategory, ICategory> {
  stringUtils.validateUUID(payload.accountingEntityId);
  stringUtils.validateUUID(payload.accountId);
  ledgerAccountEntity.validateMaterializedPath(payload.accountMaterializedPath);
  helpers.validateStatus(payload.status);

  const name = helpers.sanitizeName(payload.name);

  const timestamp = new Date();

  const category: ICategory = Object.freeze({
    id: generateUUID(),
    accountingEntityId: payload.accountingEntityId,
    accountId: payload.accountId,
    version: 1,
    name,
    status: payload.status,
    accountMaterializedPath: payload.accountMaterializedPath,
    isGrouping: Boolean(payload.isGrouping),
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  });

  const event = categoryEvents.created(category);

  return [category, [event]];
}

function update(
  category: ICategory,
  options: Partial<Pick<ICategory, 'name' | 'isGrouping'>>
): TEntityWithEvents<ICategory, ICategory> {
  const currentState = {
    name: category.name,
    isGrouping: category.isGrouping,
  };

  const updatedState = {
    name: options.name ?? currentState.name,
    isGrouping: Boolean(options.isGrouping ?? currentState.isGrouping),
  };

  const { hasChanges } = generateDiff(updatedState, currentState);

  if (!hasChanges) {
    return [category, []] as TEntityWithEvents<ICategory, ICategory>;
  }

  const updatedName = helpers.sanitizeName(updatedState.name);

  const updatedCategory: ICategory = Object.freeze({
    id: category.id,
    accountingEntityId: category.accountingEntityId,
    accountId: category.accountId,
    accountMaterializedPath: category.accountMaterializedPath,
    name: updatedName,
    version: category.version + 1,
    status: category.status,
    isGrouping: updatedState.isGrouping,
    createdAt: category.createdAt,
    deletedAt: category.deletedAt,
    updatedAt: new Date(),
  });

  const event = categoryEvents.updated(updatedCategory);

  return [updatedCategory, [event]];
}

function makeHistory(
  payload: IMakeHistoryLogPayload
): Readonly<ICategoryHistory> {
  stringUtils.validateUUID(payload.current.id);
  stringUtils.validateUUID(payload.userId);
  helpers.validateHistoryAction(payload.action);

  const note = helpers.getHistoryNote(payload.note);

  const { before, after } = generateDiff(payload.current, payload.previous);

  const log: ICategoryHistory = Object.freeze({
    categoryId: payload.current.id,
    userId: payload.userId,
    action: payload.action,
    note,
    diff: { before, after },
    createdAt: new Date(),
  });

  return log;
}

const categoryEntity = Object.freeze({
  make,
  update,
  makeHistory,
  ...helpers,
});

export default categoryEntity;
