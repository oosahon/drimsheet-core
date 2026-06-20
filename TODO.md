# TODO

Because there are multiple things to take into consideration when recoring journal entries, using an single usecase `src/app/journal-entry/usecases/create-journal-entry.usecase.ts` will not cut it.

Consider the workflow of the following journal source types:

- Purchase (for invoices): an invoice could be generated after payment has been made or it at the same time payment was made. In this situation, the usecase may create both the invoice, the purchase journal and the payment journal entries.
- A similar scenario could occur for receipt and sale.
- An adjustment could be to void or alter a journal entry depending on whether or not it has been posted.

We also need to determin the side from the journal entry rules and not the DTO/usecases. Right now, `src/app/journal-entry/dtos/journal-entry.dto.ts` carries `side`, which is not ideal. A situation could arise where the client messes up the sides and create an invariant in the system. We need to add a `getSides()` method that will return `{source: UJournalSide; destination: UJournalSide;}` to `src/domain/accounting/rules/bookkeeping/*.rule.ts`

We also need to change the shape of the rules from:

```ts
const paymentTransactionRule = Object.freeze({
  permittedSources: {
    behaviors: ALLOWED_SOURCE_BEHAVIORS,
  },
  permittedDestinations: {
    subtypes: ALLOWED_DESTINATION_SUBTYPES,
  },
  enforce: enforcer,
});
```

to:

```ts
...
function getPermits() {
    return {
        sources: {
            behaviors: ALLOWED_SOURCE_BEHAVIORS,
        },
        destinations: {
            subtypes: ALLOWED_DESTINATION_SUBTYPES,
        },
    }
}

function getSides() {
    return {
        source: <journalSide>,
        destination: <journalSide>
    }
}

const paymentTransactionRule = Object.freeze({
    enforce: enforcer,
    getPermits,
    getSides

});

```

The usecase must get this sides from the accounting rule. The service `src/app/bookkeeping/services/transaction-entry.service.ts` MUST validate these sides before before creating the journal entries.
