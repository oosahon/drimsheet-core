export interface IAuthorizationResource<
  Action extends string,
  State extends string | undefined = undefined,
> {
  readonly name: string;
  readonly permissions: readonly {
    readonly action: Action;
    readonly state?: State;
  }[];
}
