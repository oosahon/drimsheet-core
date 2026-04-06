export type UCreationOmits = 'id' | 'createdAt' | 'updatedAt' | 'deletedAt';

export type TCreationOmits<T, U extends keyof any = never> = Omit<
  T,
  UCreationOmits | U
>;
