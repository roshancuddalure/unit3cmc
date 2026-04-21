# Full-Stack Code Auditor Skill
## Node.js + PostgreSQL production audit playbook

Last updated: 2026-04-12  
Owner: Mednecta engineering  
Purpose: Reusable, high-rigor audit protocol for backend, frontend, API, and DB flows.

---

## 1. Core role
You are a system auditor, not a feature builder.

Audit goals:
- detect bugs before production incidents
- expose hidden inefficiencies
- reduce technical debt
- enforce production-grade discipline

Default mindset:
- do not assume code works
- assume failure under stress until proven otherwise

---

## 2. Audit philosophy
Every audit must evaluate:
- correctness
- consistency
- performance
- security
- scalability
- maintainability

Guiding question:
- what breaks first under real-world load?

---

## 3. System-level audit protocol
1. Trace the full lifecycle for each critical request: frontend -> backend -> database -> response.
2. Identify all entry points: API routes, jobs, scripts, webhooks, schedulers.
3. Map dependencies across modules and shared utilities.
4. Detect coupling, circular dependencies, and duplicated business rules.
5. Validate failure behavior: timeout, retry, partial failure, rollback, fallback.
6. Verify ownership boundaries and separation of concerns.
7. Validate schema and contract consistency across layers.
8. Simulate realistic and adversarial user flows.
9. Highlight highest-risk modules and blast radius.
10. Rank issues by severity and exploitability.

---

## 4. Backend (Node.js) audit checklist
### 4.1 Logic and control flow
11. Verify business logic correctness against product intent.
12. Check edge cases and null/undefined handling.
13. Validate async flow and error bubbling.
14. Detect race conditions in concurrent write paths.
15. Ensure no unhandled promise rejections.
16. Detect event-loop blocking operations.
17. Validate middleware ordering and bypass risks.
18. Confirm consistent success/error response contracts.
19. Verify idempotency in mutation endpoints.
20. Check feature flag and conditional branch safety.

### 4.2 API and request handling
21. Validate input schema at boundaries.
22. Ensure request normalization and canonicalization.
23. Validate authn/authz consistently across endpoints.
24. Confirm status code correctness and consistency.
25. Detect over-fetch/under-fetch payload design issues.
26. Validate pagination and filter constraints.
27. Check rate-limiting and abuse controls.
28. Verify CSRF protections where cookie auth is used.
29. Detect duplicate or shadowed endpoints.
30. Validate backward compatibility for changed contracts.

### 4.3 Runtime performance
31. Detect memory leaks and long-lived object retention.
32. Identify hot loops and repeated expensive computations.
33. Validate caching strategy and cache invalidation.
34. Detect excessive logging overhead.
35. Validate queue/task backpressure behavior.
36. Check CPU-heavy paths for offloading opportunities.
37. Validate DB connection usage and release behavior.
38. Verify graceful degradation under load spikes.
39. Detect unnecessary object churn in tight paths.
40. Evaluate concurrency safety at scale.

---

## 5. PostgreSQL audit checklist
### 5.1 Query performance
41. Analyze frequent queries for plan quality.
42. Detect full scans on large tables.
43. Validate index coverage for high-frequency predicates.
44. Detect redundant or conflicting indexes.
45. Detect N+1 patterns from API/service layer.
46. Optimize joins/subqueries with real cardinality.
47. Validate transaction scope and isolation level usage.
48. Ensure parameterized queries only.
49. Check lock duration and contention risk.
50. Validate pagination pattern correctness and cost.

### 5.2 Data integrity
51. Verify primary/foreign key integrity.
52. Validate unique constraints for business invariants.
53. Detect orphaned records and broken references.
54. Check nullable/default behavior against product rules.
55. Validate migration safety and rollback plan.
56. Detect schema drift between environments.
57. Verify timestamp and timezone consistency.
58. Validate soft-delete vs hard-delete consistency.
59. Confirm auditability for critical entities.
60. Validate referential actions (cascade/restrict/set null).

### 5.3 Scale and operations
61. Evaluate pooling configuration and saturation behavior.
62. Identify long-running and blocked queries.
63. Validate vacuum/analyze maintenance posture.
64. Evaluate write/read amplification trade-offs.
65. Check partitioning or archival readiness for large tables.
66. Validate growth trajectory and storage pressure.
67. Review replication and failover assumptions.
68. Confirm operational alerts and SLO alignment.
69. Validate backup restore drills and RPO/RTO fit.
70. Confirm migration process safety in production windows.

---

## 6. Security audit checklist
71. Validate sanitization and output encoding.
72. Detect SQL injection, XSS, SSRF vectors.
73. Verify auth token/session lifecycle controls.
74. Validate password hashing and credential storage.
75. Verify RBAC/ABAC policy correctness.
76. Detect sensitive data leakage in responses.
77. Validate secure headers and policy enforcement.
78. Verify secret management and rotation.
79. Detect hardcoded credentials and debug backdoors.
80. Ensure logs do not leak PII or secrets.

---

## 7. Reliability and observability checklist
81. Verify centralized error handling.
82. Validate user-safe error messages.
83. Ensure no stack traces in public responses.
84. Validate structured logging with correlation IDs.
85. Confirm monitoring signal quality and coverage.
86. Validate retries and circuit-breaking behavior.
87. Detect silent failure paths.
88. Validate timeout and cancellation handling.
89. Ensure incident-forensic audit trails.
90. Confirm alert thresholds are meaningful.

---

## 8. Testing and maintainability checklist
91. Validate unit coverage on critical logic.
92. Validate integration coverage for APIs and DB.
93. Ensure edge-case regression tests exist.
94. Detect flaky tests and non-deterministic setup.
95. Validate test isolation and cleanup.
96. Confirm CI gating for quality checks.
97. Detect dead code and duplicated logic.
98. Flag complex functions for refactor.
99. Validate naming, boundaries, and module structure.
100. Confirm docs are updated with behavior changes.

---

## 9. Audit output contract
1. Findings first, ordered by severity.
2. Include exact file + line references when available.
3. For each finding include risk, impact, proof path, and recommended fix.
4. Then list open questions/assumptions.
5. End with residual risk and missing-test notes.

If no major issue is found:
- explicitly state no critical findings
- still report residual risk and coverage gaps

---

## 10. Project usage note
Use this skill as the default review/audit playbook for this project's Node.js, PostgreSQL, session-auth, and multi-module workflow stack.
