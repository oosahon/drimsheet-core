import makeAccountingEntityService from '../../../domain/accounting/services/accounting-entity.service';

const accountingEntity = makeAccountingEntityService();

const accountingServices = Object.freeze({
  accountingEntity,
});

export default accountingServices;
