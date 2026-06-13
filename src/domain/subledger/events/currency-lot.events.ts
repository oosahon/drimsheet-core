import eventValue from '../../../shared/value-objects/event.vo';
import {
  ICurrencyLot,
  ICurrencyLotAdjustment,
  ICurrencyLotSale,
} from '../types/currency-lot-subledger.types';

export const ECurrencyLotEvent = {
  LotCreated: 'domain:subledger:currency-lot:created',
  LotUpdated: 'domain:subledger:currency-lot:updated',
  LotAdjustmentCreated: 'domain:subledger:currency-lot:adjustment:created',
  LotAdjustmentUpdated: 'domain:subledger:currency-lot:adjustment:updated',
  LotSaleCreated: 'domain:subledger:currency-lot:sale:created',
} as const;

function makeLotCreatedEvent(payload: ICurrencyLot) {
  return eventValue.make<ICurrencyLot>({
    type: ECurrencyLotEvent.LotCreated,
    data: payload,
  });
}

function makeLotUpdatedEvent(payload: ICurrencyLot) {
  return eventValue.make<ICurrencyLot>({
    type: ECurrencyLotEvent.LotUpdated,
    data: payload,
  });
}

function makeLotAdjustmentCreatedEvent(payload: ICurrencyLotAdjustment) {
  return eventValue.make<ICurrencyLotAdjustment>({
    type: ECurrencyLotEvent.LotAdjustmentCreated,
    data: payload,
  });
}

function makeLotAdjustmentUpdatedEvent(payload: ICurrencyLotAdjustment) {
  return eventValue.make<ICurrencyLotAdjustment>({
    type: ECurrencyLotEvent.LotAdjustmentUpdated,
    data: payload,
  });
}

function makeLotSaleCreatedEvent(payload: ICurrencyLotSale) {
  return eventValue.make<ICurrencyLotSale>({
    type: ECurrencyLotEvent.LotSaleCreated,
    data: payload,
  });
}

const currencyLotEvents = Object.freeze({
  lotCreated: makeLotCreatedEvent,
  lotUpdated: makeLotUpdatedEvent,
  lotAdjustmentCreated: makeLotAdjustmentCreatedEvent,
  lotAdjustmentUpdated: makeLotAdjustmentUpdatedEvent,
  lotSaleCreated: makeLotSaleCreatedEvent,
});

export default currencyLotEvents;
