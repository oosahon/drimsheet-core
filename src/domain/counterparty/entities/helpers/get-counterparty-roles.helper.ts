import {
  ECounterpartyRole,
  ICounterpartyMeta,
  UCounterpartyRole,
} from '@domain/counterparty/types/counterparty.types';

/** Derives membership in a stable order from the metadata's own role keys. */
export default function getCounterpartyRolesHelper(
  meta: ICounterpartyMeta
): UCounterpartyRole[] {
  return Object.values(ECounterpartyRole).filter((role) =>
    Object.prototype.hasOwnProperty.call(meta, role)
  );
}
