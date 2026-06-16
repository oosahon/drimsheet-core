import { ICurrency } from '../../../../domain/currency/types/currency.types';
import mockCurrencyRepo from '../../../../infra/persistence/repos/currency/__mocks__/currency.repo.impl.mock';
import mockRequestContext from '../../../../infra/services/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../../shared/contracts/request-context.contract';
import makeGetCurrenciesUseCase from '../get-currencies.usecase';

/**
 * ========= USECASE TESTS =========
 *
 * DOMAIN: global
 *
 * This usecase is used to get all supported currencies
 */
describe('makeGetCurrenciesUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get all currencies successfully', async () => {
    const correlationId = 'test-corr-id';

    mockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

    const mockCurrencies = [
      { code: 'USD', symbol: '$', name: 'US Dollar', minorUnit: 2n },
      { code: 'EUR', symbol: '€', name: 'Euro', minorUnit: 2n },
    ] as ICurrency[];

    mockCurrencyRepo.findAll.mockResolvedValue(mockCurrencies);

    const usecase = makeGetCurrenciesUseCase(
      mockCurrencyRepo,
      mockRequestContext
    );
    const result = await usecase();

    expect(mockRequestContext.get).toHaveBeenCalledTimes(1);
    expect(mockCurrencyRepo.findAll).toHaveBeenCalledWith({ correlationId });
    expect(result).toEqual(
      mockCurrencies.map((c) => ({
        ...c,
        minorUnit: Number(c.minorUnit),
      }))
    );
  });
});
