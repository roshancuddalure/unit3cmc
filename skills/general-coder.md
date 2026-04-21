# Full-Stack Engineering Mastery Framework

## Core philosophy
A full-stack developer does not operate in isolation. Every modification is a system-wide mutation that affects backend, middleware, frontend, data integrity, performance, and user experience.

The objective is to consistently build systems that are:
- predictable
- scalable
- maintainable
- secure
- resource-efficient

Every line of code must justify its existence.

## I. Change management discipline
1. Every backend change must trigger a review of middleware and frontend dependencies.
2. Every frontend change must validate API contracts and backend responses.
3. Maintain strict synchronization of request/response schemas across all layers.
4. Never introduce breaking API changes without versioning.
5. Maintain a single source of truth for data contracts.
6. Ensure backward compatibility before merging changes.
7. All changes must be traceable.
8. No silent updates; every change should be documented.
9. Evaluate full system impact before implementing features.
10. Use feature flags for controlled deployments when appropriate.

## II. Code integrity and structure
11. Maintain strict separation of concerns.
12. Avoid tight coupling between components.
13. Ensure modular and reusable architecture.
14. Eliminate duplicate logic.
15. Follow consistent naming conventions.
16. Each function must have a single responsibility.
17. Refactor continuously to avoid technical debt.
18. Remove unused or dead code.
19. Maintain a clean and scalable project structure.
20. Enforce linting and formatting rules.

## III. Data flow discipline
21. Validate all incoming data at backend boundaries.
22. Never trust client-side input.
23. Standardize API error formats.
24. Maintain consistent response structures.
25. Avoid over-fetching and under-fetching.
26. Optimize payload sizes.
27. Implement pagination and filtering where needed.
28. Prevent redundant API calls.
29. Use caching intelligently.
30. Ensure idempotency in critical operations.

## IV. Performance optimization
31. Measure before optimizing.
32. Minimize database queries.
33. Avoid N+1 query problems.
34. Use efficient algorithms and structures.
35. Prevent unnecessary frontend re-renders.
36. Implement lazy loading where applicable.
37. Optimize API latency.
38. Compress responses and assets where appropriate.
39. Monitor CPU and memory usage.
40. Avoid blocking operations.

## V. Error handling and debugging
41. Never expose internal errors to users.
42. Centralize error handling logic.
43. Log errors with full context.
44. Differentiate system vs user errors.
45. Implement graceful fallbacks.
46. Retry transient failures where safe.
47. Avoid silent failures.
48. Reproduce bugs before fixing.
49. Fix root causes, not symptoms.
50. Maintain structured logs for traceability.

## VI. Security discipline
51. Validate and sanitize all inputs.
52. Protect against injection and XSS attacks.
53. Avoid exposing sensitive data.
54. Enforce authentication and authorization.
55. Follow least-privilege access principles.
56. Encrypt sensitive data when stored.
57. Rotate credentials periodically.
58. Never hardcode secrets.
59. Audit dependencies regularly.
60. Ensure secure session handling.

## VII. Testing discipline
61. Write unit tests for core logic.
62. Maintain integration testing for APIs.
63. Implement end-to-end testing where needed.
64. Cover edge cases thoroughly.
65. Keep test data consistent.
66. Ensure tests are repeatable.
67. Run tests before every deployment.
68. Never ignore failing tests.
69. Mock external dependencies properly.
70. Maintain performance testing for critical paths.

## VIII. Deployment and environment discipline
71. Maintain parity across environments.
72. Use environment-based configurations.
73. Automate deployment pipelines.
74. Run smoke tests after deployment.
75. Always have rollback mechanisms.
76. Monitor deployments in real time.
77. Avoid manual production changes.
78. Use version-controlled releases.
79. Validate in staging before production.
80. Implement zero-downtime deployment strategies where needed.

## IX. Resource and cost efficiency
81. Avoid over-provisioning infrastructure.
82. Eliminate unnecessary background processes.
83. Clean unused resources regularly.
84. Optimize database indexing.
85. Monitor cost metrics actively.
86. Reduce redundant computations.
87. Use caching for expensive operations.
88. Prevent memory leaks.
89. Design for efficiency from the start.
90. Audit systems periodically for waste.

## X. Collaboration and maintainability
91. Write readable and maintainable code.
92. Document APIs and logic clearly.
93. Maintain onboarding documentation.
94. Enforce strict code reviews.
95. Ensure consistency across contributions.
96. Avoid over-engineering.
97. Communicate assumptions clearly.
98. Align code with business logic.
99. Maintain architecture diagrams where useful.
100. Build systems that scale with minimal friction.

## XI. Leadership-level thinking
101. Think in systems, not isolated components.
102. Anticipate failure before it occurs.
103. Design for scalability from day one.
104. Balance speed with maintainability.
105. Lead through clarity in code.
106. Prefer reliability over cleverness.
107. Reduce complexity wherever possible.
108. Make data-driven decisions.
109. Build self-sustaining systems.
110. Treat code as a long-term asset.

## Project usage note
Use this framework as the default engineering discipline guide for all future work in the Unit 3 Management System.

## Project addendum: H5P and mixed identifier systems

- Do not assume all persisted entity IDs in this project are UUIDs.
- When integrating external runtimes such as H5P, preserve the identifier shape they actually produce.
- If a shared table such as `audit_events` records multiple entity families, choose a type that safely supports all of them.
