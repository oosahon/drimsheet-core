import { relations } from 'drizzle-orm/relations';

import {
  accountingContextHistoryInAudit,
  accountingContextsInCore,
  accountingEntitiesInCore,
  accountingEntityHistoryInAudit,
  accountingPeriodHistoryInAudit,
  accountingPeriodsInCore,
  accountingStandardsInCore,
  bankDetailsInCore,
  counterpartiesInCore,
  counterpartyContractorHistoryInAudit,
  counterpartyContractorsInCore,
  counterpartyEmployerHistoryInAudit,
  counterpartyEmployersInCore,
  counterpartyHistoryInAudit,
  counterpartyRolesInCore,
  counterpartyVendorHistoryInAudit,
  counterpartyVendorsInCore,
  currenciesInCore,
  currencyExchangeRatesInCore,
  fiscalYearHistoryInAudit,
  fiscalYearsInCore,
  journalEntriesInCore,
  journalEntryAttachmentsInCore,
  journalEntryHistoryInAudit,
  journalLineHistoryInAudit,
  journalLinesInCore,
  jurisdictionAccountingStandardsInCore,
  jurisdictionsInCore,
  ledgerAccountBalanceAdjustmentsInCore,
  ledgerAccountBalancesInCore,
  ledgerAccountHistoryInAudit,
  ledgerAccountsInCore,
  reportingContextHistoryInAudit,
  reportingContextsInCore,
  reportingPeriodHistoryInAudit,
  reportingPeriodsInCore,
  subledgerFxCostBasisLotAcquisitionHistoryInAudit,
  subledgerFxCostBasisLotAcquisitionsInCore,
  subledgerFxCostBasisLotHistoryInAudit,
  subledgerFxCostBasisLotsInCore,
  userAuthInCore,
  userPreferencesInCore,
  userProfileHistoryInAudit,
  userSessionsInCore,
  usersInCore,
} from './schema';

export const userAuthInCoreRelations = relations(userAuthInCore, ({ one }) => ({
  usersInCore: one(usersInCore, {
    fields: [userAuthInCore.userId],
    references: [usersInCore.id],
  }),
}));

export const usersInCoreRelations = relations(usersInCore, ({ many }) => ({
  userAuthInCores: many(userAuthInCore),
  userSessionsInCores: many(userSessionsInCore),
  userProfileHistoryInAudits: many(userProfileHistoryInAudit),
  accountingEntitiesInCores: many(accountingEntitiesInCore),
  accountingEntityHistoryInAudits: many(accountingEntityHistoryInAudit),
  userPreferencesInCores: many(userPreferencesInCore),
  fiscalYearHistoryInAudits: many(fiscalYearHistoryInAudit),
  accountingPeriodHistoryInAudits: many(accountingPeriodHistoryInAudit),
  accountingContextHistoryInAudits: many(accountingContextHistoryInAudit),
  reportingPeriodHistoryInAudits: many(reportingPeriodHistoryInAudit),
  reportingContextHistoryInAudits: many(reportingContextHistoryInAudit),
  ledgerAccountsInCores: many(ledgerAccountsInCore),
  ledgerAccountHistoryInAudits: many(ledgerAccountHistoryInAudit),
  counterpartyHistoryInAudits: many(counterpartyHistoryInAudit),
  counterpartyVendorHistoryInAudits: many(counterpartyVendorHistoryInAudit),
  counterpartyEmployerHistoryInAudits: many(counterpartyEmployerHistoryInAudit),
  counterpartyContractorHistoryInAudits: many(
    counterpartyContractorHistoryInAudit
  ),
  journalEntryHistoryInAudits: many(journalEntryHistoryInAudit),
  journalEntriesInCores: many(journalEntriesInCore),
  journalLineHistoryInAudits: many(journalLineHistoryInAudit),
  ledgerAccountBalanceAdjustmentsInCores: many(
    ledgerAccountBalanceAdjustmentsInCore
  ),
  subledgerFxCostBasisLotHistoryInAudits: many(
    subledgerFxCostBasisLotHistoryInAudit
  ),
  subledgerFxCostBasisLotAcquisitionHistoryInAudits: many(
    subledgerFxCostBasisLotAcquisitionHistoryInAudit
  ),
}));

export const userSessionsInCoreRelations = relations(
  userSessionsInCore,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [userSessionsInCore.userId],
      references: [usersInCore.id],
    }),
  })
);

export const userProfileHistoryInAuditRelations = relations(
  userProfileHistoryInAudit,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [userProfileHistoryInAudit.userId],
      references: [usersInCore.id],
    }),
  })
);

export const currencyExchangeRatesInCoreRelations = relations(
  currencyExchangeRatesInCore,
  ({ one }) => ({
    currenciesInCore_baseCurrencyCode: one(currenciesInCore, {
      fields: [currencyExchangeRatesInCore.baseCurrencyCode],
      references: [currenciesInCore.code],
      relationName:
        'currencyExchangeRatesInCore_baseCurrencyCode_currenciesInCore_code',
    }),
    currenciesInCore_targetCurrencyCode: one(currenciesInCore, {
      fields: [currencyExchangeRatesInCore.targetCurrencyCode],
      references: [currenciesInCore.code],
      relationName:
        'currencyExchangeRatesInCore_targetCurrencyCode_currenciesInCore_code',
    }),
  })
);

export const currenciesInCoreRelations = relations(
  currenciesInCore,
  ({ many }) => ({
    currencyExchangeRatesInCores_baseCurrencyCode: many(
      currencyExchangeRatesInCore,
      {
        relationName:
          'currencyExchangeRatesInCore_baseCurrencyCode_currenciesInCore_code',
      }
    ),
    currencyExchangeRatesInCores_targetCurrencyCode: many(
      currencyExchangeRatesInCore,
      {
        relationName:
          'currencyExchangeRatesInCore_targetCurrencyCode_currenciesInCore_code',
      }
    ),
    jurisdictionsInCores: many(jurisdictionsInCore),
    accountingEntitiesInCores: many(accountingEntitiesInCore),
    reportingContextsInCores: many(reportingContextsInCore),
    ledgerAccountsInCores: many(ledgerAccountsInCore),
    ledgerAccountBalancesInCores_currencyCode: many(
      ledgerAccountBalancesInCore,
      {
        relationName:
          'ledgerAccountBalancesInCore_currencyCode_currenciesInCore_code',
      }
    ),
    ledgerAccountBalancesInCores_functionalCurrencyCode: many(
      ledgerAccountBalancesInCore,
      {
        relationName:
          'ledgerAccountBalancesInCore_functionalCurrencyCode_currenciesInCore_code',
      }
    ),
    journalLinesInCores_currencyCode: many(journalLinesInCore, {
      relationName: 'journalLinesInCore_currencyCode_currenciesInCore_code',
    }),
    journalLinesInCores_functionalCurrencyCode: many(journalLinesInCore, {
      relationName:
        'journalLinesInCore_functionalCurrencyCode_currenciesInCore_code',
    }),
    ledgerAccountBalanceAdjustmentsInCores_functionalCurrencyCode: many(
      ledgerAccountBalanceAdjustmentsInCore,
      {
        relationName:
          'ledgerAccountBalanceAdjustmentsInCore_functionalCurrencyCode_currenciesInCore_code',
      }
    ),
    ledgerAccountBalanceAdjustmentsInCores_currencyCode: many(
      ledgerAccountBalanceAdjustmentsInCore,
      {
        relationName:
          'ledgerAccountBalanceAdjustmentsInCore_currencyCode_currenciesInCore_code',
      }
    ),
    subledgerFxCostBasisLotsInCores_costBasisCurrency: many(
      subledgerFxCostBasisLotsInCore,
      {
        relationName:
          'subledgerFxCostBasisLotsInCore_costBasisCurrency_currenciesInCore_code',
      }
    ),
    subledgerFxCostBasisLotsInCores_originalQuantityCurrency: many(
      subledgerFxCostBasisLotsInCore,
      {
        relationName:
          'subledgerFxCostBasisLotsInCore_originalQuantityCurrency_currenciesInCore_code',
      }
    ),
    subledgerFxCostBasisLotAcquisitionsInCores_costBasisCurrency: many(
      subledgerFxCostBasisLotAcquisitionsInCore,
      {
        relationName:
          'subledgerFxCostBasisLotAcquisitionsInCore_costBasisCurrency_currenciesInCore_code',
      }
    ),
    subledgerFxCostBasisLotAcquisitionsInCores_quantityCurrency: many(
      subledgerFxCostBasisLotAcquisitionsInCore,
      {
        relationName:
          'subledgerFxCostBasisLotAcquisitionsInCore_quantityCurrency_currenciesInCore_code',
      }
    ),
  })
);

export const jurisdictionsInCoreRelations = relations(
  jurisdictionsInCore,
  ({ one, many }) => ({
    currenciesInCore: one(currenciesInCore, {
      fields: [jurisdictionsInCore.currencyCode],
      references: [currenciesInCore.code],
    }),
    accountingEntitiesInCores: many(accountingEntitiesInCore),
    jurisdictionAccountingStandardsInCores: many(
      jurisdictionAccountingStandardsInCore
    ),
  })
);

export const accountingEntitiesInCoreRelations = relations(
  accountingEntitiesInCore,
  ({ one, many }) => ({
    currenciesInCore: one(currenciesInCore, {
      fields: [accountingEntitiesInCore.functionalCurrencyCode],
      references: [currenciesInCore.code],
    }),
    jurisdictionsInCore: one(jurisdictionsInCore, {
      fields: [accountingEntitiesInCore.jurisdictionCode],
      references: [jurisdictionsInCore.code],
    }),
    usersInCore: one(usersInCore, {
      fields: [accountingEntitiesInCore.ownerId],
      references: [usersInCore.id],
    }),
    fiscalYearsInCores: many(fiscalYearsInCore),
    userPreferencesInCores: many(userPreferencesInCore),
    accountingPeriodsInCores: many(accountingPeriodsInCore),
    accountingContextsInCores: many(accountingContextsInCore),
    reportingPeriodsInCores: many(reportingPeriodsInCore),
    reportingContextsInCores: many(reportingContextsInCore),
    ledgerAccountsInCores: many(ledgerAccountsInCore),
    ledgerAccountBalancesInCores: many(ledgerAccountBalancesInCore),
    counterpartiesInCores: many(counterpartiesInCore),
    journalEntriesInCores: many(journalEntriesInCore),
    subledgerFxCostBasisLotsInCores: many(subledgerFxCostBasisLotsInCore),
    subledgerFxCostBasisLotAcquisitionsInCores: many(
      subledgerFxCostBasisLotAcquisitionsInCore
    ),
    bankDetailsInCores: many(bankDetailsInCore),
  })
);

export const accountingEntityHistoryInAuditRelations = relations(
  accountingEntityHistoryInAudit,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [accountingEntityHistoryInAudit.userId],
      references: [usersInCore.id],
    }),
  })
);

export const fiscalYearsInCoreRelations = relations(
  fiscalYearsInCore,
  ({ one, many }) => ({
    accountingEntitiesInCore: one(accountingEntitiesInCore, {
      fields: [fiscalYearsInCore.accountingEntityId],
      references: [accountingEntitiesInCore.id],
    }),
    accountingPeriodsInCores: many(accountingPeriodsInCore),
    accountingContextsInCores: many(accountingContextsInCore),
    reportingPeriodsInCores: many(reportingPeriodsInCore),
  })
);

export const userPreferencesInCoreRelations = relations(
  userPreferencesInCore,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [userPreferencesInCore.id],
      references: [usersInCore.id],
    }),
    accountingEntitiesInCore: one(accountingEntitiesInCore, {
      fields: [userPreferencesInCore.lastActiveAccountingEntityId],
      references: [accountingEntitiesInCore.id],
    }),
  })
);

export const fiscalYearHistoryInAuditRelations = relations(
  fiscalYearHistoryInAudit,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [fiscalYearHistoryInAudit.userId],
      references: [usersInCore.id],
    }),
  })
);

export const accountingPeriodsInCoreRelations = relations(
  accountingPeriodsInCore,
  ({ one, many }) => ({
    accountingEntitiesInCore: one(accountingEntitiesInCore, {
      fields: [accountingPeriodsInCore.accountingEntityId],
      references: [accountingEntitiesInCore.id],
    }),
    fiscalYearsInCore: one(fiscalYearsInCore, {
      fields: [accountingPeriodsInCore.fiscalYearId],
      references: [fiscalYearsInCore.id],
    }),
    accountingContextsInCores: many(accountingContextsInCore),
  })
);

export const accountingPeriodHistoryInAuditRelations = relations(
  accountingPeriodHistoryInAudit,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [accountingPeriodHistoryInAudit.userId],
      references: [usersInCore.id],
    }),
  })
);

export const accountingContextsInCoreRelations = relations(
  accountingContextsInCore,
  ({ one, many }) => ({
    accountingEntitiesInCore: one(accountingEntitiesInCore, {
      fields: [accountingContextsInCore.accountingEntityId],
      references: [accountingEntitiesInCore.id],
    }),
    accountingStandardsInCore: one(accountingStandardsInCore, {
      fields: [accountingContextsInCore.accountingStandardCode],
      references: [accountingStandardsInCore.code],
    }),
    accountingPeriodsInCore: one(accountingPeriodsInCore, {
      fields: [accountingContextsInCore.currentOperatingPeriodId],
      references: [accountingPeriodsInCore.id],
    }),
    fiscalYearsInCore: one(fiscalYearsInCore, {
      fields: [accountingContextsInCore.fiscalYearId],
      references: [fiscalYearsInCore.id],
    }),
    reportingContextsInCores: many(reportingContextsInCore),
  })
);

export const accountingStandardsInCoreRelations = relations(
  accountingStandardsInCore,
  ({ many }) => ({
    accountingContextsInCores: many(accountingContextsInCore),
    reportingContextsInCores: many(reportingContextsInCore),
    jurisdictionAccountingStandardsInCores: many(
      jurisdictionAccountingStandardsInCore
    ),
  })
);

export const accountingContextHistoryInAuditRelations = relations(
  accountingContextHistoryInAudit,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [accountingContextHistoryInAudit.userId],
      references: [usersInCore.id],
    }),
  })
);

export const reportingPeriodsInCoreRelations = relations(
  reportingPeriodsInCore,
  ({ one, many }) => ({
    accountingEntitiesInCore: one(accountingEntitiesInCore, {
      fields: [reportingPeriodsInCore.accountingEntityId],
      references: [accountingEntitiesInCore.id],
    }),
    fiscalYearsInCore: one(fiscalYearsInCore, {
      fields: [reportingPeriodsInCore.fiscalYearId],
      references: [fiscalYearsInCore.id],
    }),
    reportingContextsInCores: many(reportingContextsInCore),
  })
);

export const reportingPeriodHistoryInAuditRelations = relations(
  reportingPeriodHistoryInAudit,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [reportingPeriodHistoryInAudit.userId],
      references: [usersInCore.id],
    }),
  })
);

export const reportingContextsInCoreRelations = relations(
  reportingContextsInCore,
  ({ one }) => ({
    accountingContextsInCore: one(accountingContextsInCore, {
      fields: [reportingContextsInCore.accountingContextId],
      references: [accountingContextsInCore.id],
    }),
    accountingEntitiesInCore: one(accountingEntitiesInCore, {
      fields: [reportingContextsInCore.accountingEntityId],
      references: [accountingEntitiesInCore.id],
    }),
    accountingStandardsInCore: one(accountingStandardsInCore, {
      fields: [reportingContextsInCore.accountingStandardCode],
      references: [accountingStandardsInCore.code],
    }),
    reportingPeriodsInCore: one(reportingPeriodsInCore, {
      fields: [reportingContextsInCore.currentReportingPeriodId],
      references: [reportingPeriodsInCore.id],
    }),
    currenciesInCore: one(currenciesInCore, {
      fields: [reportingContextsInCore.reportingCurrencyCode],
      references: [currenciesInCore.code],
    }),
  })
);

export const reportingContextHistoryInAuditRelations = relations(
  reportingContextHistoryInAudit,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [reportingContextHistoryInAudit.userId],
      references: [usersInCore.id],
    }),
  })
);

export const ledgerAccountsInCoreRelations = relations(
  ledgerAccountsInCore,
  ({ one, many }) => ({
    accountingEntitiesInCore: one(accountingEntitiesInCore, {
      fields: [ledgerAccountsInCore.accountingEntityId],
      references: [accountingEntitiesInCore.id],
    }),
    ledgerAccountsInCore: one(ledgerAccountsInCore, {
      fields: [ledgerAccountsInCore.controlAccountId],
      references: [ledgerAccountsInCore.id],
      relationName:
        'ledgerAccountsInCore_controlAccountId_ledgerAccountsInCore_id',
    }),
    ledgerAccountsInCores: many(ledgerAccountsInCore, {
      relationName:
        'ledgerAccountsInCore_controlAccountId_ledgerAccountsInCore_id',
    }),
    usersInCore: one(usersInCore, {
      fields: [ledgerAccountsInCore.createdBy],
      references: [usersInCore.id],
    }),
    currenciesInCore: one(currenciesInCore, {
      fields: [ledgerAccountsInCore.currencyCode],
      references: [currenciesInCore.code],
    }),
    ledgerAccountBalancesInCores: many(ledgerAccountBalancesInCore),
    journalLinesInCores: many(journalLinesInCore),
    ledgerAccountBalanceAdjustmentsInCores: many(
      ledgerAccountBalanceAdjustmentsInCore
    ),
    subledgerFxCostBasisLotsInCores: many(subledgerFxCostBasisLotsInCore),
    subledgerFxCostBasisLotAcquisitionsInCores: many(
      subledgerFxCostBasisLotAcquisitionsInCore
    ),
    bankDetailsInCores: many(bankDetailsInCore),
  })
);

export const ledgerAccountHistoryInAuditRelations = relations(
  ledgerAccountHistoryInAudit,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [ledgerAccountHistoryInAudit.userId],
      references: [usersInCore.id],
    }),
  })
);

export const ledgerAccountBalancesInCoreRelations = relations(
  ledgerAccountBalancesInCore,
  ({ one }) => ({
    accountingEntitiesInCore: one(accountingEntitiesInCore, {
      fields: [ledgerAccountBalancesInCore.accountingEntityId],
      references: [accountingEntitiesInCore.id],
    }),
    currenciesInCore_currencyCode: one(currenciesInCore, {
      fields: [ledgerAccountBalancesInCore.currencyCode],
      references: [currenciesInCore.code],
      relationName:
        'ledgerAccountBalancesInCore_currencyCode_currenciesInCore_code',
    }),
    currenciesInCore_functionalCurrencyCode: one(currenciesInCore, {
      fields: [ledgerAccountBalancesInCore.functionalCurrencyCode],
      references: [currenciesInCore.code],
      relationName:
        'ledgerAccountBalancesInCore_functionalCurrencyCode_currenciesInCore_code',
    }),
    ledgerAccountsInCore: one(ledgerAccountsInCore, {
      fields: [ledgerAccountBalancesInCore.ledgerAccountId],
      references: [ledgerAccountsInCore.id],
    }),
  })
);

export const counterpartiesInCoreRelations = relations(
  counterpartiesInCore,
  ({ one, many }) => ({
    accountingEntitiesInCore: one(accountingEntitiesInCore, {
      fields: [counterpartiesInCore.accountingEntityId],
      references: [accountingEntitiesInCore.id],
    }),
    counterpartyVendorsInCores: many(counterpartyVendorsInCore),
    counterpartyEmployersInCores: many(counterpartyEmployersInCore),
    counterpartyContractorsInCores: many(counterpartyContractorsInCore),
    journalLinesInCores: many(journalLinesInCore),
    counterpartyRolesInCores: many(counterpartyRolesInCore),
  })
);

export const counterpartyHistoryInAuditRelations = relations(
  counterpartyHistoryInAudit,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [counterpartyHistoryInAudit.userId],
      references: [usersInCore.id],
    }),
  })
);

export const counterpartyVendorHistoryInAuditRelations = relations(
  counterpartyVendorHistoryInAudit,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [counterpartyVendorHistoryInAudit.userId],
      references: [usersInCore.id],
    }),
  })
);

export const counterpartyVendorsInCoreRelations = relations(
  counterpartyVendorsInCore,
  ({ one }) => ({
    counterpartiesInCore: one(counterpartiesInCore, {
      fields: [counterpartyVendorsInCore.counterpartyId],
      references: [counterpartiesInCore.id],
    }),
  })
);

export const counterpartyEmployersInCoreRelations = relations(
  counterpartyEmployersInCore,
  ({ one }) => ({
    counterpartiesInCore: one(counterpartiesInCore, {
      fields: [counterpartyEmployersInCore.counterpartyId],
      references: [counterpartiesInCore.id],
    }),
  })
);

export const counterpartyEmployerHistoryInAuditRelations = relations(
  counterpartyEmployerHistoryInAudit,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [counterpartyEmployerHistoryInAudit.userId],
      references: [usersInCore.id],
    }),
  })
);

export const counterpartyContractorsInCoreRelations = relations(
  counterpartyContractorsInCore,
  ({ one }) => ({
    counterpartiesInCore: one(counterpartiesInCore, {
      fields: [counterpartyContractorsInCore.counterpartyId],
      references: [counterpartiesInCore.id],
    }),
  })
);

export const counterpartyContractorHistoryInAuditRelations = relations(
  counterpartyContractorHistoryInAudit,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [counterpartyContractorHistoryInAudit.userId],
      references: [usersInCore.id],
    }),
  })
);

export const journalEntryHistoryInAuditRelations = relations(
  journalEntryHistoryInAudit,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [journalEntryHistoryInAudit.userId],
      references: [usersInCore.id],
    }),
  })
);

export const journalEntriesInCoreRelations = relations(
  journalEntriesInCore,
  ({ one, many }) => ({
    accountingEntitiesInCore: one(accountingEntitiesInCore, {
      fields: [journalEntriesInCore.accountingEntityId],
      references: [accountingEntitiesInCore.id],
    }),
    usersInCore: one(usersInCore, {
      fields: [journalEntriesInCore.createdBy],
      references: [usersInCore.id],
    }),
    journalEntriesInCore: one(journalEntriesInCore, {
      fields: [journalEntriesInCore.voidingEntryId],
      references: [journalEntriesInCore.id],
      relationName:
        'journalEntriesInCore_voidingEntryId_journalEntriesInCore_id',
    }),
    journalEntriesInCores: many(journalEntriesInCore, {
      relationName:
        'journalEntriesInCore_voidingEntryId_journalEntriesInCore_id',
    }),
    journalEntryAttachmentsInCores: many(journalEntryAttachmentsInCore),
    journalLinesInCores: many(journalLinesInCore),
    ledgerAccountBalanceAdjustmentsInCores: many(
      ledgerAccountBalanceAdjustmentsInCore
    ),
    subledgerFxCostBasisLotAcquisitionsInCores: many(
      subledgerFxCostBasisLotAcquisitionsInCore
    ),
  })
);

export const journalEntryAttachmentsInCoreRelations = relations(
  journalEntryAttachmentsInCore,
  ({ one }) => ({
    journalEntriesInCore: one(journalEntriesInCore, {
      fields: [journalEntryAttachmentsInCore.journalEntryId],
      references: [journalEntriesInCore.id],
    }),
  })
);

export const journalLinesInCoreRelations = relations(
  journalLinesInCore,
  ({ one }) => ({
    ledgerAccountsInCore: one(ledgerAccountsInCore, {
      fields: [journalLinesInCore.accountId],
      references: [ledgerAccountsInCore.id],
    }),
    counterpartiesInCore: one(counterpartiesInCore, {
      fields: [journalLinesInCore.counterpartyId],
      references: [counterpartiesInCore.id],
    }),
    currenciesInCore_currencyCode: one(currenciesInCore, {
      fields: [journalLinesInCore.currencyCode],
      references: [currenciesInCore.code],
      relationName: 'journalLinesInCore_currencyCode_currenciesInCore_code',
    }),
    journalEntriesInCore: one(journalEntriesInCore, {
      fields: [journalLinesInCore.entryId],
      references: [journalEntriesInCore.id],
    }),
    currenciesInCore_functionalCurrencyCode: one(currenciesInCore, {
      fields: [journalLinesInCore.functionalCurrencyCode],
      references: [currenciesInCore.code],
      relationName:
        'journalLinesInCore_functionalCurrencyCode_currenciesInCore_code',
    }),
  })
);

export const journalLineHistoryInAuditRelations = relations(
  journalLineHistoryInAudit,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [journalLineHistoryInAudit.userId],
      references: [usersInCore.id],
    }),
  })
);

export const ledgerAccountBalanceAdjustmentsInCoreRelations = relations(
  ledgerAccountBalanceAdjustmentsInCore,
  ({ one }) => ({
    currenciesInCore_functionalCurrencyCode: one(currenciesInCore, {
      fields: [ledgerAccountBalanceAdjustmentsInCore.functionalCurrencyCode],
      references: [currenciesInCore.code],
      relationName:
        'ledgerAccountBalanceAdjustmentsInCore_functionalCurrencyCode_currenciesInCore_code',
    }),
    usersInCore: one(usersInCore, {
      fields: [ledgerAccountBalanceAdjustmentsInCore.createdBy],
      references: [usersInCore.id],
    }),
    currenciesInCore_currencyCode: one(currenciesInCore, {
      fields: [ledgerAccountBalanceAdjustmentsInCore.currencyCode],
      references: [currenciesInCore.code],
      relationName:
        'ledgerAccountBalanceAdjustmentsInCore_currencyCode_currenciesInCore_code',
    }),
    journalEntriesInCore: one(journalEntriesInCore, {
      fields: [ledgerAccountBalanceAdjustmentsInCore.journalEntryId],
      references: [journalEntriesInCore.id],
    }),
    ledgerAccountsInCore: one(ledgerAccountsInCore, {
      fields: [ledgerAccountBalanceAdjustmentsInCore.ledgerAccountId],
      references: [ledgerAccountsInCore.id],
    }),
  })
);

export const subledgerFxCostBasisLotsInCoreRelations = relations(
  subledgerFxCostBasisLotsInCore,
  ({ one, many }) => ({
    accountingEntitiesInCore: one(accountingEntitiesInCore, {
      fields: [subledgerFxCostBasisLotsInCore.accountingEntityId],
      references: [accountingEntitiesInCore.id],
    }),
    currenciesInCore_costBasisCurrency: one(currenciesInCore, {
      fields: [subledgerFxCostBasisLotsInCore.costBasisCurrency],
      references: [currenciesInCore.code],
      relationName:
        'subledgerFxCostBasisLotsInCore_costBasisCurrency_currenciesInCore_code',
    }),
    ledgerAccountsInCore: one(ledgerAccountsInCore, {
      fields: [subledgerFxCostBasisLotsInCore.ledgerAccountId],
      references: [ledgerAccountsInCore.id],
    }),
    currenciesInCore_originalQuantityCurrency: one(currenciesInCore, {
      fields: [subledgerFxCostBasisLotsInCore.originalQuantityCurrency],
      references: [currenciesInCore.code],
      relationName:
        'subledgerFxCostBasisLotsInCore_originalQuantityCurrency_currenciesInCore_code',
    }),
    subledgerFxCostBasisLotAcquisitionsInCores: many(
      subledgerFxCostBasisLotAcquisitionsInCore
    ),
  })
);

export const subledgerFxCostBasisLotHistoryInAuditRelations = relations(
  subledgerFxCostBasisLotHistoryInAudit,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [subledgerFxCostBasisLotHistoryInAudit.userId],
      references: [usersInCore.id],
    }),
  })
);

export const subledgerFxCostBasisLotAcquisitionsInCoreRelations = relations(
  subledgerFxCostBasisLotAcquisitionsInCore,
  ({ one }) => ({
    accountingEntitiesInCore: one(accountingEntitiesInCore, {
      fields: [subledgerFxCostBasisLotAcquisitionsInCore.accountingEntityId],
      references: [accountingEntitiesInCore.id],
    }),
    currenciesInCore_costBasisCurrency: one(currenciesInCore, {
      fields: [subledgerFxCostBasisLotAcquisitionsInCore.costBasisCurrency],
      references: [currenciesInCore.code],
      relationName:
        'subledgerFxCostBasisLotAcquisitionsInCore_costBasisCurrency_currenciesInCore_code',
    }),
    journalEntriesInCore: one(journalEntriesInCore, {
      fields: [subledgerFxCostBasisLotAcquisitionsInCore.journalEntryId],
      references: [journalEntriesInCore.id],
    }),
    ledgerAccountsInCore: one(ledgerAccountsInCore, {
      fields: [subledgerFxCostBasisLotAcquisitionsInCore.ledgerAccountId],
      references: [ledgerAccountsInCore.id],
    }),
    subledgerFxCostBasisLotsInCore: one(subledgerFxCostBasisLotsInCore, {
      fields: [subledgerFxCostBasisLotAcquisitionsInCore.lotId],
      references: [subledgerFxCostBasisLotsInCore.id],
    }),
    currenciesInCore_quantityCurrency: one(currenciesInCore, {
      fields: [subledgerFxCostBasisLotAcquisitionsInCore.quantityCurrency],
      references: [currenciesInCore.code],
      relationName:
        'subledgerFxCostBasisLotAcquisitionsInCore_quantityCurrency_currenciesInCore_code',
    }),
  })
);

export const subledgerFxCostBasisLotAcquisitionHistoryInAuditRelations =
  relations(subledgerFxCostBasisLotAcquisitionHistoryInAudit, ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [subledgerFxCostBasisLotAcquisitionHistoryInAudit.userId],
      references: [usersInCore.id],
    }),
  }));

export const counterpartyRolesInCoreRelations = relations(
  counterpartyRolesInCore,
  ({ one }) => ({
    counterpartiesInCore: one(counterpartiesInCore, {
      fields: [counterpartyRolesInCore.counterpartyId],
      references: [counterpartiesInCore.id],
    }),
  })
);

export const jurisdictionAccountingStandardsInCoreRelations = relations(
  jurisdictionAccountingStandardsInCore,
  ({ one }) => ({
    accountingStandardsInCore: one(accountingStandardsInCore, {
      fields: [jurisdictionAccountingStandardsInCore.accountingStandardCode],
      references: [accountingStandardsInCore.code],
    }),
    jurisdictionsInCore: one(jurisdictionsInCore, {
      fields: [jurisdictionAccountingStandardsInCore.jurisdictionCode],
      references: [jurisdictionsInCore.code],
    }),
  })
);

export const bankDetailsInCoreRelations = relations(
  bankDetailsInCore,
  ({ one }) => ({
    accountingEntitiesInCore: one(accountingEntitiesInCore, {
      fields: [bankDetailsInCore.accountingEntityId],
      references: [accountingEntitiesInCore.id],
    }),
    ledgerAccountsInCore: one(ledgerAccountsInCore, {
      fields: [bankDetailsInCore.ledgerAccountId],
      references: [ledgerAccountsInCore.id],
    }),
  })
);
