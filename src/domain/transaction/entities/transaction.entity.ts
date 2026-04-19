import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import generateDiff from '../../../shared/utils/diff-generator';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import { AppError } from '../../../shared/value-objects/error';
import moneyValue from '../../../shared/value-objects/money.vo';
import transactionEvents from '../events/transaction.events';
import {
  ITransaction,
  ITransactionHistoryLog,
  ITransactionItem,
} from '../types/transaction.types';

import transactionItemEntity, {
  TMakeTransactionItemPayload,
} from './transaction-item.entity';

export type TMakeTransactionPayload = Omit<
  TCreationOmits<ITransaction, 'version'>,
  'items'
> & {
  items: TMakeTransactionItemPayload[];
};

interface IMakeHistoryLogPayload extends Pick<
  ITransactionHistoryLog,
  'action' | 'userId' | 'note'
> {
  previous?: ITransaction | null;
  current: ITransaction;
}

function validateUUIDs(payload: TMakeTransactionPayload) {
  stringUtils.validateUUID(payload.accountingEntityId);
  stringUtils.validateUUID(payload.createdBy);
  stringUtils.validateUUID(payload.sourceAccountId);

  if (payload.counterPartyId) {
    stringUtils.validateUUID(payload.counterPartyId);
  }
}

function validateAmounts(payload: TMakeTransactionPayload) {
  moneyValue.validate(payload.amount);
  moneyValue.validate(payload.functionalCurrencyAmount);

  if (!payload.items || payload.items.length === 0) {
    throw new AppError('Transaction must have at least one item');
  }

  const itemAmounts = payload.items.map((i) => i.amount);
  const functionalItemAmounts = payload.items.map(
    (i) => i.functionalCurrencyAmount
  );

  itemAmounts.forEach((a) => moneyValue.validate(a));
  functionalItemAmounts.forEach((a) => moneyValue.validate(a));

  if (!moneyValue.isSameCurrency(payload.amount, ...itemAmounts)) {
    throw new AppError(
      'All items must have the same currency as the transaction amount'
    );
  }

  if (
    !moneyValue.isSameCurrency(
      payload.functionalCurrencyAmount,
      ...functionalItemAmounts
    )
  ) {
    throw new AppError(
      'All functional items must have the same currency as the transaction functional amount'
    );
  }

  const itemsSum = itemAmounts.reduce((acc, curr) => moneyValue.add(acc, curr));
  if (!moneyValue.equals(payload.amount, itemsSum)) {
    throw new AppError(
      'Sum of transaction items must equal the transaction amount'
    );
  }

  const functionalItemsSum = functionalItemAmounts.reduce((acc, curr) =>
    moneyValue.add(acc, curr)
  );
  if (
    !moneyValue.equals(payload.functionalCurrencyAmount, functionalItemsSum)
  ) {
    throw new AppError(
      'Sum of transaction functional items must equal the transaction functional amount'
    );
  }
}

function validate(payload: TMakeTransactionPayload) {
  validateUUIDs(payload);
  validateAmounts(payload);
}

function make(
  payload: TMakeTransactionPayload
): TEntityWithEvents<ITransaction, ITransaction | ITransactionItem> {
  validate(payload);

  const timestamp = new Date();
  const transactionId = generateUUID();

  const itemsWithEvents = payload.items.map((item) =>
    transactionItemEntity.make(transactionId, payload.type, timestamp, item)
  );

  const items = itemsWithEvents.map(([item]) => item);
  const itemsEvents = itemsWithEvents.flatMap(([, events]) => events);

  const transaction: ITransaction = Object.freeze({
    id: transactionId,
    accountingEntityId: payload.accountingEntityId,
    reference: payload.reference,
    type: payload.type,
    status: payload.status,
    effectiveDate: payload.effectiveDate,
    createdBy: payload.createdBy,
    sourceAccountId: payload.sourceAccountId,
    amount: payload.amount,
    functionalCurrencyAmount: payload.functionalCurrencyAmount,
    exchangeRate: payload.exchangeRate,
    attachments: payload.attachments,
    counterPartyId: payload.counterPartyId ?? null,
    notes: payload.notes ?? null,
    items,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const event = transactionEvents.created(transaction);

  return [transaction, [event, ...itemsEvents]];
}

function update(
  transaction: ITransaction,
  options: Partial<
    Pick<
      ITransaction,
      'reference' | 'status' | 'effectiveDate' | 'counterPartyId' | 'notes'
    >
  >
): TEntityWithEvents<ITransaction, ITransaction> {
  const currentState = {
    reference: transaction.reference,
    status: transaction.status,
    effectiveDate: transaction.effectiveDate,
    counterPartyId: transaction.counterPartyId,
    notes: transaction.notes,
  };

  const updatedState = {
    reference: options.reference ?? currentState.reference,
    status: options.status ?? currentState.status,
    effectiveDate: options.effectiveDate ?? currentState.effectiveDate,
    counterPartyId:
      options.counterPartyId !== undefined
        ? options.counterPartyId
        : currentState.counterPartyId,
    notes: options.notes !== undefined ? options.notes : currentState.notes,
  };

  const { hasChanges } = generateDiff(updatedState, currentState);

  if (!hasChanges) {
    return [transaction, []] as TEntityWithEvents<ITransaction, ITransaction>;
  }

  const updatedTransaction: ITransaction = Object.freeze({
    ...transaction,
    ...updatedState,
    version: transaction.version + 1,
    updatedAt: new Date(),
  });

  const event = transactionEvents.updated(updatedTransaction);

  return [updatedTransaction, [event]];
}

function makeHistoryLog(
  payload: IMakeHistoryLogPayload
): Readonly<ITransactionHistoryLog> {
  stringUtils.validateUUID(payload.current.id);
  stringUtils.validateUUID(payload.userId);

  let note = undefined;

  if (payload.note) {
    note = stringUtils.sanitizeAndValidate(payload.note, { max: 100, min: 1 });
  }

  const { before, after } = generateDiff(payload.current, payload.previous);

  const log: ITransactionHistoryLog = Object.freeze({
    transactionId: payload.current.id,
    userId: payload.userId,
    action: payload.action,
    note,
    diff: { before, after },
    createdAt: new Date(),
  });

  return log;
}

const transactionEntity = Object.freeze({
  make,
  update,
  makeHistoryLog,
  validate,
  validateUUIDs,
  validateAmounts,
});

export default transactionEntity;
