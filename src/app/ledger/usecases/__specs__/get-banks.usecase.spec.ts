import appError from '../../../../shared/values/errors/app.error';
import makeGetBanksUseCase from '../get-banks.usecase';

describe('makeGetBanksUseCase', () => {
  const getBanks = makeGetBanksUseCase();

  it('returns deterministic bank-name-sorted bank directory for Nigeria (NG)', async () => {
    const result = await getBanks({ countryCode: 'NG' });

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toEqual({
      countryCode: 'NG',
      bankCode: '044',
      bankName: 'Access Bank',
    });

    const bankNames = result.map((b) => b.bankName);
    const sortedBankNames = [...bankNames].sort((a, b) => a.localeCompare(b));
    expect(bankNames).toEqual(sortedBankNames);
  });

  it('preserves leading zeroes in string bank codes', async () => {
    const result = await getBanks({ countryCode: 'NG' });
    const accessBank = result.find((b) => b.bankName === 'Access Bank');
    const firstBank = result.find(
      (b) => b.bankName === 'First Bank of Nigeria'
    );

    expect(accessBank?.bankCode).toBe('044');
    expect(firstBank?.bankCode).toBe('011');
    expect(typeof accessBank?.bankCode).toBe('string');
  });

  it('returns empty array for valid configured jurisdiction with no dummy banks', async () => {
    const result = await getBanks({ countryCode: 'US' });
    expect(result).toEqual([]);
  });

  it('handles lowercase country code inputs', async () => {
    const result = await getBanks({ countryCode: 'ng' });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].countryCode).toBe('NG');
  });

  it('throws UnprocessableEntity error for invalid or unsupported country code', async () => {
    await expect(getBanks({ countryCode: 'XX' })).rejects.toThrow(
      appError.UnprocessableEntity
    );
  });

  it('guarantees immutability across repeated calls', async () => {
    const firstCall = await getBanks({ countryCode: 'NG' });
    firstCall[0].bankName = 'Mutated Bank Name';

    const secondCall = await getBanks({ countryCode: 'NG' });
    expect(secondCall[0].bankName).toBe('Access Bank');
  });
});
