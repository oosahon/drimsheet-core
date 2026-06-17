---
Title: Database Migration Skill
Description: Use this skill when you need to work with migrations
---

## Tool

We use `node-pg-migrate` as our migration tool.

## Creation

To create a migration file, use the following:

```bash
nom run db:migrate create <name-in-kebab-case>
```

Avoid hardcoding table names, define tables names inside `db/config`.

Example:

```ts
import { userAuthTable, usersTable } from '../config/users';

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable(
    userAuthTable,
    {
        ...
    },
    {
      ifNotExists: true,
    }
  );
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropTable(userAuthTable);
};

```

Hwe have helpers for turning these into schema strings for. For example:

```ts
// db/migrations/1777326842180_jurisdiction-accounting-standards.ts

...
import toSchemaString from '../utils/to-schema-string';


export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(jurisdictionAccountingStandardsTable, {
    ...
    accounting_standard_code: {
      type: 'varchar(15)',
      notNull: true,
      references: accountingStandardsTable,
      onDelete: 'CASCADE',
      primaryKey: true,
    },

    accounting_entity_type: {
      type: toSchemaString(accountingEntityType),
      ...
    },
    ...
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(jurisdictionAccountingStandardsTable);
}

```

## Running Migration

To run the newly created migration file, use:

```bash
nom run db:migrate up
```

## Dropping Migration

To drop a migration, run:

```txt
nom run db:migrate <count>
```

For example, to the drop the last ten:

```zsh
nom run db:migrate 10
```

Or to drop the last one:

```zsh
nom run db:migrate
```

## Post Migration

After successfully running a migration, run the following to sync drizzle:

```zsh
npm run drizzle:pull
```

## Note:

- `src/infra/config/drizzle` must not be edited directly
