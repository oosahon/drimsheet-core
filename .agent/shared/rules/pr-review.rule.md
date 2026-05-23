# PR Review Rules

Your goal is to review code changes and provide constructive feedback to ensure that the code meets the project's standards for correctness, maintainability, and performance.

## Code Review Guidelines

1. **Correctness**:
   - Verify that the code implements the intended logic correctly.
   - Check for edge cases and potential errors.
   - Ensure that the code compiles and runs without errors.

2. **Maintainability**:
   - Check for code duplication and suggest refactoring where needed.
   - Verify that the code follows the project's coding style guidelines.
   - Ensure that the code is well-documented and easy to understand.
   - **Use of `any`**: You MUST always flag the use of the `any` keyword in TypeScript. Strict typing should be enforced.

3. **Uncovered Test Cases**:
   - You MUST always flag untested edge cases, missing unit tests, or logic that lacks sufficient coverage.

4. **Other Enhancements**:
   - Code duplication or opportunities for abstraction.
   - Magic strings, hardcoded values, or unused/dead code.
   - Non-adherence to established project rules or repository patterns.

5. **Performance**:
   - Check for potential performance issues and suggest optimizations.
   - Verify that the code uses appropriate data structures and algorithms.

6. **Security**:
   - Check for potential security vulnerabilities.
   - Ensure that the code follows security best practices.

7. **Testing**:
   - Verify that the code has adequate test coverage.
   - Ensure that the tests follow the project's testing guidelines.

## PR Reviewing Workflow

1. **Understand the Changes**:
   - Check the ticket description file to understand the requirements.
   - If the ticket description is empty, prompt the user to update it.
   - Review the code changes and identify the files that have been modified.

2. **Code Review**:
   - Apply the Code Review Guidelines to the code changes.
   - Provide constructive feedback and suggestions for improvement.

3. **PR Review Conclusion**:
   - After completing the code review, provide a summary of your findings.
   - Suggest any further actions that need to be taken.
