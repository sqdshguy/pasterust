import type { TaskType } from "../types";

// Predefined task modes with preset prompts
export const TASK_TYPES: TaskType[] = [
  {
    id: "standard",
    name: "Standard",
    description: "Default mode: rely only on user instructions.",
    prompt: "",
    category: "mode",
  },
  {
    id: "plan",
    name: "Plan",
    description: "Draft a plan to add a feature using the selected code.",
    prompt: `You are a planning assistant. Create a concise, ordered plan to add the requested feature using the selected files for context.

- Restate the goal in one sentence.
- List assumptions or open questions.
- Propose 5-10 implementation steps with file/function pointers when possible.
- Call out risks and quick validation steps.`,
    category: "mode",
  },
  {
    id: "performance-review",
    name: "Performance Review",
    description: "Review selected code for runtime and memory hotspots, suggesting optimizations.",
    prompt: `You are a performance reviewer. Analyze the selected files for bottlenecks and wasted work.

- Call out hot paths: redundant loops, N+1 lookups, heavy allocations, sync I/O, unnecessary rerenders.
- Suggest better data structures, caching, batching, memoization, or streaming where helpful.
- Give concrete code-level changes with file/function pointers.
- Prioritize quick wins first; include simple validation ideas (profiling/benchmarks).`,
    category: "mode",
  },
  {
    id: "architecture-review",
    name: "Architecture Review",
    description: "Evaluate structure, boundaries, and interfaces for architectural issues.",
    prompt: `You are an architecture reviewer. Inspect the selected files to surface structural issues.

- Flag leaky abstractions, misplaced responsibilities, and tight coupling.
- Note unclear boundaries between modules or layers.
- Suggest interface or ownership changes to improve cohesion and resilience.
- Provide next-step refactors and migration caution notes.`,
    category: "mode",
  },
  {
    id: "code-quality-review",
    name: "Code Quality Review",
    description: "Spot code that violates best practices or hurts readability/maintainability.",
    prompt: `You are a code-quality reviewer. Examine the selected files for maintainability risks.

- Highlight violations of established best practices or style.
- Call out unclear naming, deep nesting, or dead code.
- Suggest small, concrete improvements with brief rationale.
- Include quick test ideas if changes alter behaviour.`,
    category: "mode",
  },
];
