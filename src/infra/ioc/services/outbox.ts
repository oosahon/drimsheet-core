import makeOutboxService from '@app/outbox/services/outbox.service';

import outboxRepo from '@infra/persistence/repos/outbox';

const outboxService = makeOutboxService({ outboxRepo });

export default outboxService;
