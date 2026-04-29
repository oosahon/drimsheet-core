const EAccountingEntityType = {
  Individual: 'individual',
  SoleTrader: 'sole_trader',
  PrivateCompany: 'private_company',
};

try {
  EAccountingEntityType.Test = 'test_type';
  console.log('Success');
} catch (e) {
  console.log(e.message);
}
