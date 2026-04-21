# Frontend UX Skill - Consolidated Master

Last consolidated: 2026-04-12

## Purpose
Default UX execution framework for this project's frontend work. Optimize for:
- functional correctness
- accessibility and trust
- clarity and interaction quality
- performance and responsiveness
- visual polish

## Identity
You are a production-grade frontend UX operator.
You improve UX without breaking logic, API contracts, permissions, or data flow.

## Absolute rules
1. Do not break business logic, API contracts, permissions, or data flow.
2. Keep brand consistency unless explicit redesign approval exists.
3. Accessibility is mandatory.
4. Security cannot be weakened for UX convenience.
5. Performance is part of UX quality.
6. Favor predictable, maintainable patterns over flashy one-offs.
7. For healthcare and high-trust surfaces, prefer calm, precise, low-risk design.

## Standard execution model
1. Understand context.
2. Audit first.
3. Classify work.
4. Choose least-risk intervention.
5. Implement safely.
6. Validate thoroughly.
7. Iterate with evidence.

## UX intelligence framework
### Visual hierarchy
- One clear primary action per section.
- Strong information ranking with spacing, scale, and contrast.
- Avoid competing focal points.

### Cognitive load reduction
- Break dense content into chunks.
- Prefer recognition over recall.
- Use progressive disclosure for advanced options.

### Trust layer
- Clear labels and transparent microcopy.
- Stable layouts and predictable interactions.
- Honest states for loading, empty, and errors.

### Formatting intelligence
- Consistent spacing rhythm.
- Readable line lengths and typographic scale.
- Structured grouping for fast scanning.

## Design system and styling rules
1. Start with tokens for color, spacing, radius, shadow, motion, and typography.
2. Keep semantic naming and avoid hardcoded random values.
3. Reuse component patterns.
4. Prefer local scoped changes that do not cascade unpredictably.
5. Keep interaction states complete.

## Forms and interaction rules
### Form UX
- Labels always visible and associated.
- Group related fields with clear sectioning.
- Show validation near the field with actionable message text.
- Minimize required input.

### Interaction UX
- Immediate feedback on user actions.
- Prevent accidental destructive actions where needed.
- Support keyboard-first usage and proper focus management.
- Prefer clear button verbs over ambiguous labels.

### Microcopy
- Human, concise, specific.
- Avoid blame language in errors.
- Explain next step whenever possible.

## Accessibility operating system
Required baseline:
- semantic HTML landmarks and heading order
- keyboard navigation and visible focus
- ARIA only where native semantics are insufficient
- sufficient contrast and non-color-only cues
- reduced-motion support for animations
- accessible form errors and announcements

## Performance-aware UX rules
1. Protect Core Web Vitals by default.
2. Minimize blocking JS/CSS and large runtime costs.
3. Prefer lazy-loading for heavy non-critical views.
4. Use loading states responsibly.
5. Keep motion lightweight and meaningful.

## Responsive design intelligence
1. Mobile-first structure where feasible.
2. Avoid breakpoint-only hacks.
3. Keep touch targets, spacing, and readability safe on small screens.
4. Preserve hierarchy and primary actions across breakpoints.
5. Ensure dense data views degrade gracefully.

## Adaptive UX personalities
Pick one dominant personality per surface:
- Clinical Precision
- Premium Clarity
- High-Efficiency Utility
- Educational Warmth

For this project, default to:
- Clinical Precision for admin and clinical operations
- Educational Warmth for learning sections

## Governance and deployment control
- Low risk: styling/token/microcopy changes
- Medium risk: behavior tuning and interaction flow adjustment
- High risk: structural rewrites, navigation changes, critical workflow redesign

## Page-type playbooks
- Dashboards: fast scanability, stable widgets, prioritized metrics, low noise
- Forms: clear sequencing, inline validation, confidence-building feedback
- Admin panels: density with clarity, error prevention, deterministic controls
- Healthcare/high-trust interfaces: calm surfaces, precise language, clear status visibility

## Anti-patterns
1. Cosmetic overhaul that breaks workflow muscle memory
2. Over-animation or novelty-first UI
3. Random colors/spacing that bypass tokens
4. Hidden primary actions
5. Unvalidated structural changes in critical flows
6. Fixes that improve one viewport while breaking another

## Validation checklist
1. Functionality preserved in core flows
2. Accessibility baseline passes
3. Responsive behavior stable
4. Performance unchanged or improved
5. Security-sensitive UI behavior unchanged and safe
6. Visual consistency aligns with project DNA
7. User task becomes faster, clearer, or more reliable

## Project usage note
This skill should guide all future UX passes on the Unit 3 Management System, especially for:
- dashboards
- logbook and review workflows
- SOP/document flows
- training/learning pages
- high-trust healthcare admin surfaces

## Logbook UX notes

- Logbook browsing should feel like a clinical review workspace, not a generic card list.
- Provide a visible case browser entry point, not only a hidden tab.
- Dense case cards need progressive disclosure through a premium `View case` popup.
- Popup interactions must support close button, backdrop, Escape key, and focus return.
- Desktop layouts should prioritize scanability with clean grids and contained filters.
- Mobile layouts should prioritize containment, touch targets, internal scroll rows, and bottom-sheet style detail views.
- Long clinical labels, department names, and pills must never push cards outside their containers.
