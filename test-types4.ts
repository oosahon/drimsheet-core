import {
  EAccountingEntityType,
  IAccountingEntity,
} from './src/domain/accounting-entity/types/accounting-entity.types';
import { TEntityId } from './src/shared/types/uuid';

const accountingEntityId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
const ownerId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;

const accountingEntity: IAccountingEntity = {
  id: accountingEntityId,
  ownerId,
  type: EAccountingEntityType.Individual,
  functionalCurrency: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    minorUnit: 2n,
  },
};
