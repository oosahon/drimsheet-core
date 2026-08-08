import { v7 as uuid } from 'uuid';

import { TEntityId } from '@shared/types/uuid';

function generateUUID(): TEntityId {
  return uuid() as TEntityId;
}

export default generateUUID;
