import stringUtils from '@shared/utils/string';

import IAppContext from '@app/context/contracts/app-context.contract';

import appContext from '@infra/runtime/app-context';

type TCorrelationContext = Pick<IAppContext, 'get'>;

export default function safeGetCorrelationId(
  context: TCorrelationContext = appContext
): string | undefined {
  try {
    const correlationId = context.get().correlationId;

    return stringUtils.isUUID(correlationId) ? correlationId : undefined;
  } catch {
    return undefined;
  }
}
