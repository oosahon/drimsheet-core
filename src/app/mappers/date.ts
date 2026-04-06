interface ICommonRepoDates {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface ICommonDomainDates {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export function toRepoDate(date: Date): string {
  return date.toISOString();
}

export function fromRepoDate(date: string): Date {
  return new Date(date);
}

export function fromCommonRepoDates(payload: ICommonRepoDates) {
  return {
    createdAt: fromRepoDate(payload.createdAt),
    updatedAt: fromRepoDate(payload.updatedAt),
    deletedAt: payload.deletedAt ? fromRepoDate(payload.deletedAt) : null,
  };
}

export function toCommonRepoDates(payload: ICommonDomainDates) {
  return {
    createdAt: toRepoDate(payload.createdAt),
    updatedAt: toRepoDate(payload.updatedAt),
    deletedAt: payload.deletedAt ? toRepoDate(payload.deletedAt) : null,
  };
}
