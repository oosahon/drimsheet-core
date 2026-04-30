import { relations } from 'drizzle-orm/relations';
import {
  accountingContextsInCore,
  accountingEntitiesInCore,
  accountingPeriodsInCore,
  accountingStandardsInCore,
  categoriesInCore,
  categoryHistoryInAudit,
  currenciesInCore,
  currencyExchangeRatesInCore,
  fiscalYearsInCore,
  journalEntriesInCore,
  journalLinesInCore,
  jurisdictionAccountingStandardsInCore,
  jurisdictionsInCore,
  ledgerAccountBalanceAdjustmentsInCore,
  ledgerAccountBalancesInCore,
  ledgerAccountsInCore,
  reportingContextsInCore,
  reportingPeriodsInCore,
  transactionLinesInCore,
  transactionsInCore,
  userActivitiesInAudit,
  userAuthInCore,
  userPreferencesInCore,
  userSessionsInCore,
  usersInCore,
} from './schema';

export const userSessionsInCoreRelations = relations(
  userSessionsInCore,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [userSessionsInCore.userId],
      references: [usersInCore.id],
    }),
  })
);

export const usersInCoreRelations = relations(usersInCore, ({ many }) => ({
  userSessionsInCores: many(userSessionsInCore),
  userAuthInCores: many(userAuthInCore),
  userActivitiesInAudits: many(userActivitiesInAudit),
  accountingEntitiesInCores: many(accountingEntitiesInCore),
  ledgerAccountsInCores: many(ledgerAccountsInCore),
  userPreferencesInCores: many(userPreferencesInCore),
  categoryHistoryInAudits: many(categoryHistoryInAudit),
  transactionsInCores: many(transactionsInCore),
  journalEntriesInCores: many(journalEntriesInCore),
  ledgerAccountBalanceAdjustmentsInCores: many(
    ledgerAccountBalanceAdjustmentsInCore
  ),
}));

export const userAuthInCoreRelations = relations(userAuthInCore, ({ one }) => ({
  usersInCore: one(usersInCore, {
    fields: [userAuthInCore.userId],
    references: [usersInCore.id],
  }),
}));

export const userActivitiesInAuditRelations = relations(
  userActivitiesInAudit,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [userActivitiesInAudit.userId],
      references: [usersInCore.id],
    }),
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

export const currenciesInCoreRelations = relations(
  currenciesInCore,
  ({ many }) => ({
    jurisdictionsInCores: many(jurisdictionsInCore),
    accountingEntitiesInCores: many(accountingEntitiesInCore),
    reportingContextsInCores: many(reportingContextsInCore),
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
    ledgerAccountsInCores: many(ledgerAccountsInCore),
    transactionsInCores: many(transactionsInCore),
    transactionLinesInCores: many(transactionLinesInCore),
    journalLinesInCores_currencyCode: many(journalLinesInCore, {
      relationName: 'journalLinesInCore_currencyCode_currenciesInCore_code',
    }),
    journalLinesInCores_functionalCurrencyCode: many(journalLinesInCore, {
      relationName:
        'journalLinesInCore_functionalCurrencyCode_currenciesInCore_code',
    }),
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
    ledgerAccountBalanceAdjustmentsInCores_currencyCode: many(
      ledgerAccountBalanceAdjustmentsInCore,
      {
        relationName:
          'ledgerAccountBalanceAdjustmentsInCore_currencyCode_currenciesInCore_code',
      }
    ),
    ledgerAccountBalanceAdjustmentsInCores_functionalCurrencyCode: many(
      ledgerAccountBalanceAdjustmentsInCore,
      {
        relationName:
          'ledgerAccountBalanceAdjustmentsInCore_functionalCurrencyCode_currenciesInCore_code',
      }
    ),
  })
);

export const accountingEntitiesInCoreRelations = relations(
  accountingEntitiesInCore,
  ({ one, many }) => ({
    usersInCore: one(usersInCore, {
      fields: [accountingEntitiesInCore.ownerId],
      references: [usersInCore.id],
    }),
    currenciesInCore: one(currenciesInCore, {
      fields: [accountingEntitiesInCore.functionalCurrencyCode],
      references: [currenciesInCore.code],
    }),
    jurisdictionsInCore: one(jurisdictionsInCore, {
      fields: [accountingEntitiesInCore.jurisdictionCode],
      references: [jurisdictionsInCore.code],
    }),
    fiscalYearsInCores: many(fiscalYearsInCore),
    accountingPeriodsInCores: many(accountingPeriodsInCore),
    accountingContextsInCores: many(accountingContextsInCore),
    reportingPeriodsInCores: many(reportingPeriodsInCore),
    reportingContextsInCores: many(reportingContextsInCore),
    ledgerAccountsInCores: many(ledgerAccountsInCore),
    categoriesInCores: many(categoriesInCore),
    transactionsInCores: many(transactionsInCore),
    journalEntriesInCores: many(journalEntriesInCore),
    ledgerAccountBalancesInCores: many(ledgerAccountBalancesInCore),
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

export const jurisdictionAccountingStandardsInCoreRelations = relations(
  jurisdictionAccountingStandardsInCore,
  ({ one }) => ({
    jurisdictionsInCore: one(jurisdictionsInCore, {
      fields: [jurisdictionAccountingStandardsInCore.jurisdictionCode],
      references: [jurisdictionsInCore.code],
    }),
    accountingStandardsInCore: one(accountingStandardsInCore, {
      fields: [jurisdictionAccountingStandardsInCore.accountingStandardCode],
      references: [accountingStandardsInCore.code],
    }),
  })
);

export const accountingStandardsInCoreRelations = relations(
  accountingStandardsInCore,
  ({ many }) => ({
    jurisdictionAccountingStandardsInCores: many(
      jurisdictionAccountingStandardsInCore
    ),
    accountingContextsInCores: many(accountingContextsInCore),
    reportingContextsInCores: many(reportingContextsInCore),
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
    fiscalYearsInCore: one(fiscalYearsInCore, {
      fields: [accountingContextsInCore.fiscalYearId],
      references: [fiscalYearsInCore.id],
    }),
    accountingPeriodsInCore: one(accountingPeriodsInCore, {
      fields: [accountingContextsInCore.currentOperatingPeriodId],
      references: [accountingPeriodsInCore.id],
    }),
    reportingContextsInCores: many(reportingContextsInCore),
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

export const reportingContextsInCoreRelations = relations(
  reportingContextsInCore,
  ({ one }) => ({
    accountingEntitiesInCore: one(accountingEntitiesInCore, {
      fields: [reportingContextsInCore.accountingEntityId],
      references: [accountingEntitiesInCore.id],
    }),
    currenciesInCore: one(currenciesInCore, {
      fields: [reportingContextsInCore.reportingCurrencyCode],
      references: [currenciesInCore.code],
    }),
    accountingContextsInCore: one(accountingContextsInCore, {
      fields: [reportingContextsInCore.accountingContextId],
      references: [accountingContextsInCore.id],
    }),
    reportingPeriodsInCore: one(reportingPeriodsInCore, {
      fields: [reportingContextsInCore.currentReportingPeriodId],
      references: [reportingPeriodsInCore.id],
    }),
    accountingStandardsInCore: one(accountingStandardsInCore, {
      fields: [reportingContextsInCore.accountingStandardCode],
      references: [accountingStandardsInCore.code],
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
    currenciesInCore: one(currenciesInCore, {
      fields: [ledgerAccountsInCore.currencyCode],
      references: [currenciesInCore.code],
    }),
    usersInCore: one(usersInCore, {
      fields: [ledgerAccountsInCore.createdBy],
      references: [usersInCore.id],
    }),
    categoriesInCores: many(categoriesInCore),
    transactionsInCores: many(transactionsInCore),
    transactionLinesInCores: many(transactionLinesInCore),
    journalLinesInCores: many(journalLinesInCore),
    ledgerAccountBalancesInCores: many(ledgerAccountBalancesInCore),
    ledgerAccountBalanceAdjustmentsInCores: many(
      ledgerAccountBalanceAdjustmentsInCore
    ),
  })
);

export const userPreferencesInCoreRelations = relations(
  userPreferencesInCore,
  ({ one }) => ({
    usersInCore: one(usersInCore, {
      fields: [userPreferencesInCore.id],
      references: [usersInCore.id],
    }),
  })
);

export const categoriesInCoreRelations = relations(
  categoriesInCore,
  ({ one, many }) => ({
    accountingEntitiesInCore: one(accountingEntitiesInCore, {
      fields: [categoriesInCore.accountingEntityId],
      references: [accountingEntitiesInCore.id],
    }),
    ledgerAccountsInCore: one(ledgerAccountsInCore, {
      fields: [categoriesInCore.accountId],
      references: [ledgerAccountsInCore.id],
    }),
    categoryHistoryInAudits: many(categoryHistoryInAudit),
  })
);

export const categoryHistoryInAuditRelations = relations(
  categoryHistoryInAudit,
  ({ one }) => ({
    categoriesInCore: one(categoriesInCore, {
      fields: [categoryHistoryInAudit.categoryId],
      references: [categoriesInCore.id],
    }),
    usersInCore: one(usersInCore, {
      fields: [categoryHistoryInAudit.userId],
      references: [usersInCore.id],
    }),
  })
);

export const transactionsInCoreRelations = relations(
  transactionsInCore,
  ({ one, many }) => ({
    accountingEntitiesInCore: one(accountingEntitiesInCore, {
      fields: [transactionsInCore.accountingEntityId],
      references: [accountingEntitiesInCore.id],
    }),
    usersInCore: one(usersInCore, {
      fields: [transactionsInCore.createdBy],
      references: [usersInCore.id],
    }),
    ledgerAccountsInCore: one(ledgerAccountsInCore, {
      fields: [transactionsInCore.sourceAccountId],
      references: [ledgerAccountsInCore.id],
    }),
    currenciesInCore: one(currenciesInCore, {
      fields: [transactionsInCore.currencyCode],
      references: [currenciesInCore.code],
    }),
    transactionLinesInCores: many(transactionLinesInCore),
    journalEntriesInCores: many(journalEntriesInCore),
    ledgerAccountBalanceAdjustmentsInCores: many(
      ledgerAccountBalanceAdjustmentsInCore
    ),
  })
);

export const transactionLinesInCoreRelations = relations(
  transactionLinesInCore,
  ({ one }) => ({
    transactionsInCore: one(transactionsInCore, {
      fields: [transactionLinesInCore.transactionId],
      references: [transactionsInCore.id],
    }),
    ledgerAccountsInCore: one(ledgerAccountsInCore, {
      fields: [transactionLinesInCore.targetAccountId],
      references: [ledgerAccountsInCore.id],
    }),
    currenciesInCore: one(currenciesInCore, {
      fields: [transactionLinesInCore.currencyCode],
      references: [currenciesInCore.code],
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
    transactionsInCore: one(transactionsInCore, {
      fields: [journalEntriesInCore.transactionId],
      references: [transactionsInCore.id],
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
    usersInCore: one(usersInCore, {
      fields: [journalEntriesInCore.createdBy],
      references: [usersInCore.id],
    }),
    journalLinesInCores: many(journalLinesInCore),
    ledgerAccountBalanceAdjustmentsInCores: many(
      ledgerAccountBalanceAdjustmentsInCore
    ),
  })
);

export const journalLinesInCoreRelations = relations(
  journalLinesInCore,
  ({ one }) => ({
    journalEntriesInCore: one(journalEntriesInCore, {
      fields: [journalLinesInCore.entryId],
      references: [journalEntriesInCore.id],
    }),
    ledgerAccountsInCore: one(ledgerAccountsInCore, {
      fields: [journalLinesInCore.accountId],
      references: [ledgerAccountsInCore.id],
    }),
    currenciesInCore_currencyCode: one(currenciesInCore, {
      fields: [journalLinesInCore.currencyCode],
      references: [currenciesInCore.code],
      relationName: 'journalLinesInCore_currencyCode_currenciesInCore_code',
    }),
    currenciesInCore_functionalCurrencyCode: one(currenciesInCore, {
      fields: [journalLinesInCore.functionalCurrencyCode],
      references: [currenciesInCore.code],
      relationName:
        'journalLinesInCore_functionalCurrencyCode_currenciesInCore_code',
    }),
  })
);

export const ledgerAccountBalancesInCoreRelations = relations(
  ledgerAccountBalancesInCore,
  ({ one }) => ({
    ledgerAccountsInCore: one(ledgerAccountsInCore, {
      fields: [ledgerAccountBalancesInCore.ledgerAccountId],
      references: [ledgerAccountsInCore.id],
    }),
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
  })
);

export const ledgerAccountBalanceAdjustmentsInCoreRelations = relations(
  ledgerAccountBalanceAdjustmentsInCore,
  ({ one }) => ({
    ledgerAccountsInCore: one(ledgerAccountsInCore, {
      fields: [ledgerAccountBalanceAdjustmentsInCore.ledgerAccountId],
      references: [ledgerAccountsInCore.id],
    }),
    currenciesInCore_currencyCode: one(currenciesInCore, {
      fields: [ledgerAccountBalanceAdjustmentsInCore.currencyCode],
      references: [currenciesInCore.code],
      relationName:
        'ledgerAccountBalanceAdjustmentsInCore_currencyCode_currenciesInCore_code',
    }),
    currenciesInCore_functionalCurrencyCode: one(currenciesInCore, {
      fields: [ledgerAccountBalanceAdjustmentsInCore.functionalCurrencyCode],
      references: [currenciesInCore.code],
      relationName:
        'ledgerAccountBalanceAdjustmentsInCore_functionalCurrencyCode_currenciesInCore_code',
    }),
    journalEntriesInCore: one(journalEntriesInCore, {
      fields: [ledgerAccountBalanceAdjustmentsInCore.journalEntryId],
      references: [journalEntriesInCore.id],
    }),
    transactionsInCore: one(transactionsInCore, {
      fields: [ledgerAccountBalanceAdjustmentsInCore.transactionId],
      references: [transactionsInCore.id],
    }),
    usersInCore: one(usersInCore, {
      fields: [ledgerAccountBalanceAdjustmentsInCore.createdBy],
      references: [usersInCore.id],
    }),
  })
);
