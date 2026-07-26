# Inversion of Control

- Construct domain and application services under
  `src/infra/ioc/services/<domain>.service.ts`.
- Construct use cases under `src/infra/ioc/usecases/<domain>.usecases.ts`.
- Inject already-constructed services into use cases. Do not invoke service
  factories inside a use-case IoC module.
- A use-case IoC module may inject repositories, ports, transaction services,
  and constructed services required by the workflow.
- Inspect existing service and use-case IoC modules before adding a new wiring
  path.
- Name exported IoC collections for what they contain. Do not call a mixed
  collection `domainServices` when it also contains application services.
