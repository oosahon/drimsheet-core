import { TErrorCause, TErrorKeys } from '@shared/types/error.types';
import errorUtils from '@shared/utils/error';
import DomainError from '@shared/values/errors/domain.error';

const EErrorKeys = {
  InvalidId: 'actor_error_id_invalid',
  InvalidType: 'actor_error_type_invalid',
  InvalidUsername: 'actor_error_username_invalid',
  InvalidDisplayName: 'actor_error_display_name_invalid',
  InvalidOwner: 'actor_error_owner_invalid',
  InvalidAgentName: 'actor_error_agent_name_invalid',
  InvalidStatus: 'actor_error_status_invalid',
  InvalidCreatedBy: 'actor_error_created_by_invalid',
  InvalidVersion: 'actor_error_version_invalid',
  InvalidDate: 'actor_error_date_invalid',
  NotFound: 'actor_error_not_found',
  Disabled: 'actor_error_disabled_forbidden',
  InvalidUserLink: 'actor_error_user_link_unexpected',
  UsernameConflict: 'actor_error_username_conflict',
} as const satisfies TErrorKeys<'actor_error'>;

type UActorError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

class ActorError extends DomainError<UActorError> {
  constructor(key: UActorError, cause?: TErrorCause) {
    super(key, cause);
    this.name = 'ActorError';
  }
}

const actorError = Object.freeze({
  Base: ActorError,
  ...errorUtils.getMappedErrors(EErrorKeys, ActorError),
});

export default actorError;
