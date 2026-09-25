import { auditSchema, coreSchema } from './schemas';

export const actorsTable = { schema: coreSchema, name: 'actors' };
export const actorHistoryTable = { schema: auditSchema, name: 'actor_history' };
