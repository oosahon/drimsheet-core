import { IEvent, TEventHandler } from '../../../shared/types/event.types';

export default interface IEventBus {
  publish(event: IEvent<unknown>): Promise<void>;

  subscribe(eventType: string, handler: TEventHandler<any>): void;
}
