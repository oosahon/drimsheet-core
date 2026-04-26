import { ITransactionalEmailDto } from '../../app/contracts/dto/workers.dto';
import { IInternalMailer } from '../../app/contracts/infra/transactional-email-agent.contract';

const sentEmails: Map<string, ITransactionalEmailDto> = new Map();

function getKey(emailAddress: string, subject: string) {
  return `${emailAddress}-${subject}`.toLowerCase();
}

async function send(payload: Omit<ITransactionalEmailDto, 'correlationId'>) {
  sentEmails.set(getKey(payload.emails[0], payload.subject), {
    ...payload,
    correlationId: Date.now().toString(),
  });
}

function getEmail(emailAddress: string, subject: string) {
  return sentEmails.get(getKey(emailAddress, subject)) ?? null;
}

const mailer: IInternalMailer = {
  send,
  getEmail,
};

export default mailer;
