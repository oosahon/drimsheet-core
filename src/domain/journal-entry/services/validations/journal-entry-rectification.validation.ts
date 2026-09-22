import { isEqual } from 'lodash';

import stringUtils from '@shared/utils/string';

import journalEntryError from '@domain/journal-entry/errors/journal-entry.error';
import { IJournalEntryRectificationPayload } from '@domain/journal-entry/types/journal-entry-rectification.types';
import { EJournalEntryStatus } from '@domain/journal-entry/types/journal-entry.types';

function validatePayload(payload: IJournalEntryRectificationPayload) {
  const { originalEntry, newEntry } = payload;
  const isRectifiable =
    originalEntry.status === EJournalEntryStatus.Draft ||
    originalEntry.status === EJournalEntryStatus.Posted;

  if (!isRectifiable) {
    throw new journalEntryError.RectificationNotPermitted({
      status: originalEntry.status,
    });
  }

  stringUtils.validateUUID(newEntry.id, journalEntryError.InvalidJournalEntry);

  if (newEntry.lines) {
    for (const line of newEntry.lines) {
      stringUtils.validateUUID(line.id, journalEntryError.RectificationLineId);
    }

    const lineIds = newEntry.lines.map((line) => line.id);
    const hasDuplicateLineIds = new Set(lineIds).size !== lineIds.length;

    if (hasDuplicateLineIds) {
      throw new journalEntryError.RectificationLineId();
    }
  }

  const changesOwner =
    (newEntry.accountingEntityId !== undefined &&
      newEntry.accountingEntityId !== originalEntry.accountingEntityId) ||
    (newEntry.sourceType !== undefined &&
      newEntry.sourceType !== originalEntry.sourceType) ||
    (newEntry.createdBy !== undefined &&
      newEntry.createdBy !== originalEntry.createdBy);

  if (changesOwner) {
    throw new journalEntryError.RectificationNotPermitted();
  }
}

function validateHasChanges(payload: IJournalEntryRectificationPayload) {
  const { originalEntry, newEntry } = payload;
  const hasHeaderChanges =
    (newEntry.attachments !== undefined &&
      !isEqual(newEntry.attachments, originalEntry.attachments)) ||
    (newEntry.memo !== undefined && newEntry.memo !== originalEntry.memo) ||
    (newEntry.status !== undefined &&
      newEntry.status !== originalEntry.status) ||
    (newEntry.effectiveDate !== undefined &&
      !isEqual(newEntry.effectiveDate, originalEntry.effectiveDate)) ||
    (newEntry.postedAt !== undefined &&
      !isEqual(newEntry.postedAt, originalEntry.postedAt));
  let hasLineChanges = false;

  if (newEntry.lines) {
    hasLineChanges = newEntry.lines.length !== originalEntry.lines.length;

    for (const line of newEntry.lines) {
      const originalLine = originalEntry.lines.find(
        (item) => item.id === line.id
      );
      const lineHasChanged =
        originalLine?.accountId !== line.accountId ||
        originalLine.counterpartyId !== line.counterpartyId ||
        originalLine.sequenceOrder !== line.sequenceOrder ||
        !isEqual(originalLine.amount, line.amount) ||
        !isEqual(originalLine.exchangeRate, line.exchangeRate) ||
        !isEqual(originalLine.functionalAmount, line.functionalAmount) ||
        originalLine.side !== line.side ||
        originalLine.description !== line.description ||
        !isEqual(originalLine.meta, line.meta);

      if (lineHasChanged) {
        hasLineChanges = true;
        break;
      }
    }
  }

  if (!hasHeaderChanges && !hasLineChanges) {
    throw new journalEntryError.RectificationHasNoChanges();
  }
}

const journalEntryRectificationValidation = Object.freeze({
  validatePayload,
  validateHasChanges,
});

export default journalEntryRectificationValidation;
