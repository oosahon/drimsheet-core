# Error Handling

Errors are treated as first-class values. Each bounded context and sub context define their errors. Therefore error handling must be scoped to the context. That is, you should throw errors of a bounded context within the same context.

When throwing errors, particularly validation errors, it might be important to send the problematic payload, hence the need for the `cause: object`

## Defining Errors

If no existing error within the bounded context currently fits the error scenario you have faced, create a new error. To understand how to create errors, see [How to create errors](../rules/error-creation.rule.md).

## Related Skills

- [Pair Programmer Skill](./pair-programmer.skill.md)
