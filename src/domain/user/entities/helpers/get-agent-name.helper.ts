import actorValidation from '@domain/user/entities/validations/actor.validation';

/** Normalizes an owned agent's name and rejects unsupported or empty names. */
export default function getAgentNameHelper(name: string): string {
  const agentName = name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  actorValidation.validateAgentName(agentName);
  return agentName;
}
