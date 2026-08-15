import {
  IExtractedErrorKey,
  validateExtractedErrorKeys,
} from '../scripts/export-error-keys';

describe('export-error-keys', () => {
  it('returns a deterministic catalogue for valid unique keys', () => {
    const entries: IExtractedErrorKey[] = [
      { filePath: 'second.error.ts', key: 'test_error_value_invalid' },
      { filePath: 'first.error.ts', key: 'test_error_state_conflict' },
    ];

    expect(validateExtractedErrorKeys(entries)).toEqual([
      'test_error_state_conflict',
      'test_error_value_invalid',
    ]);
  });

  it('reports every malformed key with its declaration', () => {
    const entries: IExtractedErrorKey[] = [
      { filePath: 'first.error.ts', key: 'test_error_missing_suffix' },
      { filePath: 'second.error.ts', key: 'test_error_internal_server_error' },
    ];

    expect(() => validateExtractedErrorKeys(entries)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'first.error.ts: test_error_missing_suffix'
        ),
      })
    );
    expect(() => validateExtractedErrorKeys(entries)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'second.error.ts: test_error_internal_server_error'
        ),
      })
    );
  });

  it('rejects duplicate values from separate declarations', () => {
    const entries: IExtractedErrorKey[] = [
      { filePath: 'first.error.ts', key: 'test_error_value_invalid' },
      { filePath: 'second.error.ts', key: 'test_error_value_invalid' },
    ];

    expect(() => validateExtractedErrorKeys(entries)).toThrow(
      'test_error_value_invalid: first.error.ts, second.error.ts'
    );
  });

  it('rejects catalogue count regressions', () => {
    const entries: IExtractedErrorKey[] = [
      { filePath: 'only.error.ts', key: 'test_error_value_invalid' },
    ];

    expect(() => validateExtractedErrorKeys(entries, 2)).toThrow(
      'Error-key count regression: found 1, expected at least 2'
    );
  });
});
