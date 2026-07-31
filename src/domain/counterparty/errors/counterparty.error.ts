import { TErrorCause } from '../../../shared/types/error.types';
import errorUtils from '../../../shared/utils/error';
import DomainError from '../../../shared/values/errors/domain.error';

type TErrorPrefix = `counterparty_error_${string}`;

const EErrorKeys = {
  InvalidAccountingEntityId: 'counterparty_error_invalid_accounting_entity_id',
  InvalidCounterpartyId: 'counterparty_error_invalid_counterparty_id',
  InvalidName: 'counterparty_error_invalid_name',
  InvalidType: 'counterparty_error_invalid_type',
  InvalidStatus: 'counterparty_error_invalid_status',
  InvalidRole: 'counterparty_error_invalid_role',
  InvalidDate: 'counterparty_error_invalid_date',
  InvalidAddress: 'counterparty_error_invalid_address',
  RoleAlreadyAssigned: 'counterparty_error_role_already_assigned',
  InvalidCounterpartyPayload: 'counterparty_error_invalid_counterparty_payload',
  InvalidCounterpartyEntity: 'counterparty_error_invalid_counterparty_entity',
  InvalidCounterpartyAction: 'counterparty_error_invalid_counterparty_action',
} as const satisfies Record<string, TErrorPrefix>;

type UCounterpartyError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class CounterpartyError<
  K extends TErrorPrefix = UCounterpartyError,
> extends DomainError<K> {
  constructor(key: K, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'CounterpartyError';
  }
}

const counterpartyError = Object.freeze({
  Base: CounterpartyError,
  ...errorUtils.getMappedErrors(EErrorKeys, CounterpartyError),
});

export default counterpartyError;
