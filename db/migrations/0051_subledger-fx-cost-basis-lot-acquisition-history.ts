import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';
import { subledgerFxCostBasisLotAcquisitionHistoryTable } from '../config/fx-cost-basis-lots';
import { historyActorType } from '../config/history';
import { usersTable } from '../config/users';
import toSchemaString from '../utils/to-schema-string';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(subledgerFxCostBasisLotAcquisitionHistoryTable, {
    id: {
      type: 'bigserial',
      primaryKey: true,
    },
    acquisition_id: {
      type: 'uuid',
      notNull: true,
    },
    lot_id: {
      type: 'uuid',
      notNull: true,
    },
    accounting_entity_id: {
      type: 'uuid',
      notNull: true,
    },
    user_id: {
      type: 'uuid',
      references: usersTable,
      onDelete: 'SET NULL',
    },
    actor_type: {
      type: toSchemaString(historyActorType),
      notNull: true,
    },
    action: {
      type: 'varchar(50)',
      notNull: true,
    },
    diff: {
      type: 'jsonb',
      notNull: true,
    },
    correlation_id: {
      type: 'varchar(255)',
    },
    occurred_at: {
      type: 'timestamptz',
      notNull: true,
    },
    recorded_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addConstraint(
    subledgerFxCostBasisLotAcquisitionHistoryTable,
    'subledger_fx_cost_basis_lot_acquisition_history_diff_check',
    {
      check: `(
        jsonb_typeof(diff) = 'object'
        AND diff ? 'before'
        AND diff ? 'after'
        AND (
          diff->'before' <> 'null'::jsonb
          OR diff->'after' <> 'null'::jsonb
        )
      )`,
    }
  );

  pgm.addConstraint(
    subledgerFxCostBasisLotAcquisitionHistoryTable,
    'subledger_fx_cost_basis_lot_acquisition_history_actor_check',
    {
      check: `(
        (actor_type = 'user' AND user_id IS NOT NULL)
        OR
        (
          actor_type IN ('system', 'migration')
          AND user_id IS NULL
        )
      )`,
    }
  );

  pgm.createIndex(
    subledgerFxCostBasisLotAcquisitionHistoryTable,
    [
      'acquisition_id',
      { name: 'occurred_at', sort: 'DESC' },
      { name: 'id', sort: 'DESC' },
    ],
    {
      name: 'subledger_fx_cost_basis_lot_acquisition_history_timeline_idx',
    }
  );

  pgm.createIndex(
    subledgerFxCostBasisLotAcquisitionHistoryTable,
    [
      'accounting_entity_id',
      { name: 'occurred_at', sort: 'DESC' },
      { name: 'id', sort: 'DESC' },
    ],
    {
      name: 'subledger_fx_cost_basis_lot_acquisition_history_tenant_timeline_idx',
    }
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(subledgerFxCostBasisLotAcquisitionHistoryTable);
}
