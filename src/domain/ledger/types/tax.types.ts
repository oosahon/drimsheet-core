/**
 * Tax types based on the Nigerian Tax Act (NTA) 2025
 * @see {@link /public/Nigeria-Tax-Act-2025.pdf} for the act
 *
 * Shared across asset (statutory receivables) and liability (statutory payables) domains.
 */
export const ETaxType = {
  ValueAddedTax: 'value_added_tax',
  WithholdingTax: 'withholding_tax',
  PayAsYouEarn: 'pay_as_you_earn',
  CorporateIncomeTax: 'corporate_income_tax',
  PersonalIncomeTax: 'personal_income_tax',
  DevelopmentLevy: 'development_levy',
  StampDuty: 'stamp_duty',
  OtherDeductionsAndLevies: 'other_deductions_and_levies',
} as const;

export type UTaxType = (typeof ETaxType)[keyof typeof ETaxType];
