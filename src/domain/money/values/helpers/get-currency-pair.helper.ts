import currencyEntity from '@domain/money/entities/currency.entity';

function getExchangeRateCurrencyPair(baseCode: string, targetCode: string) {
  currencyEntity.validateCode(baseCode);
  currencyEntity.validateCode(targetCode);

  return `${baseCode}/${targetCode}`;
}

export default getExchangeRateCurrencyPair;
