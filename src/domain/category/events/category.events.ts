import eventValue from '../../../shared/value-objects/event.vo';
import { ICategory } from '../types/category.types';

export const ECategoryEvent = {
  CategoryCreated: 'domain:category:created',
  CategoryUpdated: 'domain:category:updated',
} as const;

export const categoryEventDescriptions: Record<string, string> = {
  [ECategoryEvent.CategoryCreated]: 'Created a new category.',
  [ECategoryEvent.CategoryUpdated]: 'Updated an existing category.',
};

function makeCategoryCreatedEvent(payload: ICategory) {
  return eventValue.make<ICategory>({
    type: ECategoryEvent.CategoryCreated,
    data: payload,
  });
}

function makeCategoryUpdatedEvent(payload: ICategory) {
  return eventValue.make<ICategory>({
    type: ECategoryEvent.CategoryUpdated,
    data: payload,
  });
}

const categoryEvents = Object.freeze({
  categoryCreated: makeCategoryCreatedEvent,
  categoryUpdated: makeCategoryUpdatedEvent,
});

export default categoryEvents;
