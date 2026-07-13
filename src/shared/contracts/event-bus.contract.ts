import { IEvent, TEventHandler } from '../events/types/event.types';

export default interface IEventBus {
  publish(event: IEvent<unknown> | IEvent<unknown>[]): Promise<void>;

  subscribe(eventType: string, handler: TEventHandler<any>): void;
}
