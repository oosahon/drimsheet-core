import makeCounterpartyService from '../../../domain/counterparty/services/counterparty.service';

const counterparty = makeCounterpartyService();

const counterpartyServices = Object.freeze({
  counterparty,
});

export default counterpartyServices;
