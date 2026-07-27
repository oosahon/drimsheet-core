# Inversion of Control

- IoC modules compose dependencies. They are not behavioral services, handlers,
  or use cases.
- Do not use behavioral suffixes such as `.service.ts`, `.handler.ts`, or
  `.usecase.ts` for new IoC composition modules. Existing files may keep their
  names until a migration is planned.
- Construct domain and application services under `src/infra/ioc/services`.
- Construct use cases under `src/infra/ioc/usecases`.
- Inject already-constructed services into use cases. Do not invoke service
  factories inside a use-case IoC module.
- A use-case IoC module may inject repositories, ports, transaction services,
  and constructed services required by the workflow.
- Inspect existing service and use-case IoC modules before adding a new wiring
  path.
- Name exported IoC collections for what they contain. Do not call a mixed
  collection `domainServices` when it also contains application services.
