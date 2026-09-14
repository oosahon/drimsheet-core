import journalLineEntity from '@domain/journal-entry/entities/journal-line.entity';
import journalLineValidation from '@domain/journal-entry/entities/validations/journal-line.validation';

describe('journalLineValidation', () => {
  it('exposes the frozen journal-line validators', () => {
    expect(Object.isFrozen(journalLineValidation)).toBe(true);
    expect(journalLineEntity.validateSide).toBe(
      journalLineValidation.validateSide
    );
    expect(Object.keys(journalLineValidation)).toEqual([
      'validateSide',
      'validateCounterpartyId',
      'validateExchangeRate',
    ]);
    expect(Object.values(journalLineValidation)).toEqual(
      expect.arrayContaining([expect.any(Function)])
    );
  });
});
