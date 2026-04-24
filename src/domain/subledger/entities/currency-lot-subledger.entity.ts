import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import { AppError } from '../../../shared/value-objects/error';
import currencyEntity from '../../currency/entities/currency.entity';
import {
  EAdjustmentType,
  UAdjustmentType,
} from '../../ledger/types/ledger.types';
import currencyLotEvents from '../events/currency-lot.events';
import {
  ICurrencyLot,
  ICurrencyLotAdjustment,
  ICurrencyLotSale,
} from '../types/currency-lot-subledger.types';

function validateAdjustmentType(adjustmentType: UAdjustmentType) {
  if (!Object.values(EAdjustmentType).includes(adjustmentType)) {
    throw new AppError('Invalid adjustment type', { cause: adjustmentType });
  }
}

function makeLot(
  payload: TCreationOmits<ICurrencyLot>
): TEntityWithEvents<ICurrencyLot, ICurrencyLot> {
  stringUtils.validateUUID(payload.journalEntryId);
  stringUtils.validateUUID(payload.accountId);
  currencyEntity.validateCode(payload.currency.code);
  currencyEntity.validateCode(payload.functionalCurrency.code);

  const timestamp = new Date();

  const lot: ICurrencyLot = Object.freeze({
    ...payload,
    id: generateUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const event = currencyLotEvents.lotCreated(lot);

  return [lot, [event]];
}

function updateLot(
  lot: ICurrencyLot,
  options: Partial<
    Pick<ICurrencyLot, 'balance' | 'adjustedFunctionalBalanceImpact'>
  >
): TEntityWithEvents<ICurrencyLot, ICurrencyLot> {
  const balance = options.balance ?? lot.balance;
  const adjustedFunctionalBalanceImpact =
    options.adjustedFunctionalBalanceImpact ??
    lot.adjustedFunctionalBalanceImpact;

  const isUnchanged =
    balance === lot.balance &&
    adjustedFunctionalBalanceImpact === lot.adjustedFunctionalBalanceImpact;

  if (isUnchanged) {
    return [lot, []] as TEntityWithEvents<ICurrencyLot, ICurrencyLot>;
  }

  const updatedLot: ICurrencyLot = Object.freeze({
    ...lot,
    balance,
    adjustedFunctionalBalanceImpact,
    updatedAt: new Date(),
  });

  const event = currencyLotEvents.lotUpdated(updatedLot);

  return [updatedLot, [event]];
}

function makeLotAdjustment(
  payload: TCreationOmits<ICurrencyLotAdjustment>
): TEntityWithEvents<ICurrencyLotAdjustment, ICurrencyLotAdjustment> {
  stringUtils.validateUUID(payload.targetLotId);
  validateAdjustmentType(payload.adjustmentType);

  const timestamp = new Date();

  const adjustment: ICurrencyLotAdjustment = Object.freeze({
    ...payload,
    id: generateUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const event = currencyLotEvents.lotAdjustmentCreated(adjustment);

  return [adjustment, [event]];
}

function updateLotAdjustment(
  adjustment: ICurrencyLotAdjustment,
  options: Partial<Pick<ICurrencyLotAdjustment, 'postedAt'>>
): TEntityWithEvents<ICurrencyLotAdjustment, ICurrencyLotAdjustment> {
  const postedAt =
    options.postedAt !== undefined ? options.postedAt : adjustment.postedAt;
  const isUnchanged = postedAt === adjustment.postedAt;

  if (isUnchanged) {
    return [adjustment, []] as TEntityWithEvents<
      ICurrencyLotAdjustment,
      ICurrencyLotAdjustment
    >;
  }

  const updatedAdjustment: ICurrencyLotAdjustment = Object.freeze({
    ...adjustment,
    postedAt,
    updatedAt: new Date(),
  });

  const event = currencyLotEvents.lotAdjustmentUpdated(updatedAdjustment);

  return [updatedAdjustment, [event]];
}

function makeLotSale(
  payload: TCreationOmits<ICurrencyLotSale>
): TEntityWithEvents<ICurrencyLotSale, ICurrencyLotSale> {
  stringUtils.validateUUID(payload.journalEntryId);
  stringUtils.validateUUID(payload.targetLotId);

  const timestamp = new Date();

  const sale: ICurrencyLotSale = Object.freeze({
    ...payload,
    id: generateUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const event = currencyLotEvents.lotSaleCreated(sale);

  return [sale, [event]];
}

const currencyLotSubledgerEntity = Object.freeze({
  validateAdjustmentType,
  makeLot,
  updateLot,
  makeLotAdjustment,
  updateLotAdjustment,
  makeLotSale,
});

export default currencyLotSubledgerEntity;
