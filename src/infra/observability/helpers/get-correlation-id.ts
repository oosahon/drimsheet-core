import IAppContext from '@app/context/contracts/app-context.contract';

import appContext from '@infra/runtime/app-context';

type TCorrelationContext = Pick<IAppContext, 'get'>;

export default function safeGetCorrelationId(
  context: TCorrelationContext = appContext
): string | undefined {
  try {
    return context.get().correlationId;
  } catch {
    return undefined;
  }
}
