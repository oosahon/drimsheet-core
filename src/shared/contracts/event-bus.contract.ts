import { IEvent, TEventHandler } from '@shared/values/events/types/event.types';

export default interface IEventBus {
  /**
   * Waits for delivery and handlers to settle. Delivery and handler failures
   * are reported by the bus and do not reject the caller's workflow.
   */
  publish(event: IEvent<unknown> | IEvent<unknown>[]): Promise<void>;

  subscribe(eventType: string, handler: TEventHandler<any>): () => void;
}
