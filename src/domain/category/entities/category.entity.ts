import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import generateDiff from '../../../shared/utils/diff-generator';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import categoryEvents from '../events/category.events';
import { ICategory, ICategoryHistoryLog } from '../types/category.types';

interface IMakeHistoryLogPayload extends Pick<
  ICategoryHistoryLog,
  'action' | 'userId' | 'note'
> {
  previous?: ICategory | null;
  current: ICategory;
}

function makeCategory(
  payload: TCreationOmits<ICategory, 'version'>
): TEntityWithEvents<ICategory, ICategory> {
  stringUtils.validateUUID(payload.accountingEntityId);
  stringUtils.validateUUID(payload.accountId);

  const timestamp = new Date();

  const category: ICategory = Object.freeze({
    ...payload,
    id: generateUUID(),
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const event = categoryEvents.categoryCreated(category);

  return [category, [event]];
}

function updateCategory(
  category: ICategory,
  options: Partial<
    Pick<ICategory, 'name' | 'displayName' | 'key' | 'isGrouping' | 'accountId'>
  >
): TEntityWithEvents<ICategory, ICategory> {
  const name = options.name ?? category.name;
  const displayName =
    options.displayName !== undefined
      ? options.displayName
      : category.displayName;
  const key = options.key ?? category.key;
  const isGrouping =
    options.isGrouping !== undefined ? options.isGrouping : category.isGrouping;
  const accountId = options.accountId ?? category.accountId;

  const isUnchanged =
    name === category.name &&
    displayName === category.displayName &&
    key === category.key &&
    isGrouping === category.isGrouping &&
    accountId === category.accountId;

  if (isUnchanged) {
    return [category, []] as TEntityWithEvents<ICategory, ICategory>;
  }

  const updatedCategory: ICategory = Object.freeze({
    ...category,
    name,
    displayName,
    key,
    isGrouping,
    accountId,
    version: category.version + 1,
    updatedAt: new Date(),
  });

  const event = categoryEvents.categoryUpdated(updatedCategory);

  return [updatedCategory, [event]];
}

function makeHistoryLog(
  payload: IMakeHistoryLogPayload
): Readonly<ICategoryHistoryLog> {
  stringUtils.validateUUID(payload.current.id);
  stringUtils.validateUUID(payload.userId);

  let note = null;

  if (payload.note) {
    note = stringUtils.sanitizeAndValidate(payload.note, { max: 100, min: 1 });
  }

  const log: ICategoryHistoryLog = Object.freeze({
    categoryId: payload.current.id,
    userId: payload.userId,
    action: payload.action,
    note,
    diff: generateDiff(payload.current, payload.previous),
    createdAt: new Date(),
  });

  return log;
}

const categoryEntity = Object.freeze({
  makeCategory,
  updateCategory,
  makeHistoryLog,
});

export default categoryEntity;
