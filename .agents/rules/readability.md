# Readability

- Optimize for a human reader scanning the workflow, not for the fewest lines.
- Use domain-specific names. Avoid vague names such as `data`, `result`, or a
  broad domain name when a more precise name is available.
- Use progressive disclosure: give a complex response a meaningful name before
  decomposing it.
- Avoid repeated tuple indexing, but do not combine a service call with large
  nested destructuring or destructure values before they are needed.
- Use one blank line between distinct concepts, workflow phases, and sequential
  persistence operations when it improves scanning.
- Follow the nearest established presentation pattern before introducing a new
  one.

Prefer:

```ts
const accountingResponse = accountingEntityService.create(input);

const {
  accountingEntity: [accountingEntity, events, audit],
} = accountingResponse;
```

Avoid both repeated access such as `response.accountingEntity[2]` and a large
destructuring expression attached directly to the service invocation.
