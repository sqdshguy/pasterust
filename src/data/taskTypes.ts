import { TaskType } from '../types';

// Task category definitions with icons
export const TASK_CATEGORIES = {
    analysis: { name: 'Analysis', icon: '🔍' },
    debug: { name: 'Debug', icon: '🐛' },
    refactor: { name: 'Refactor', icon: '♻️' },
    feature: { name: 'Feature', icon: '⭐' },
    documentation: { name: 'Documentation', icon: '📚' }
};

// Predefined task types with preset prompts
export const TASK_TYPES: TaskType[] = [
    {
        id: 'code-review',
        name: 'Code Review',
        description: 'Comprehensive code analysis and review',
        prompt: `You are a senior software engineer and code-quality coach. 
Your task is to review the **selected files** thoroughly.

**Please:**
1. **Assess quality & style** – highlight violations of language or project conventions.
2. **Locate bugs / security risks** – map each to file & line number if possible.
3. **Spot performance smells** – add micro-benchmark suggestions where relevant.
4. **Judge maintainability** – readability, modularity, naming, comments.
5. **Recommend actionable fixes** – clear, specific, with code snippets.

**Output format (Markdown):**
- \`## Summary\`
- \`## Findings\` (*table: category | file:line | issue | recommendation*)
- \`## Suggested Patches\` (*concise diff blocks*)
- \`## Next Steps\`

Think step-by-step before writing. Do **not** change the code style guide unless requested.`,
    category: 'analysis'
},
{
    id: 'bug-fix',
    name: 'Bug Fix',
    description: 'Identify and fix bugs in the code',
    prompt: `You are a debugging specialist. Examine the **selected files** to find and fix defects.

**Process:**
1. Reproduce or reason about each suspected bug.
2. Explain root cause (in plain language).
3. Provide minimal yet complete patch (\`diff\` or full snippet).
4. Add regression test suggestion.
5. Propose prevention tactics (lint rule, CI check, pattern).

**Output (Markdown):**
\`## Bug List\`, \`## Fixes\`, \`## Tests\`, \`## Prevention\`.

Respond only with the report; no extra commentary.`,
        category: 'debug'
    },
    {
        id: 'refactor',
        name: 'Code Refactoring',
        description: 'Improve code structure and maintainability',
        prompt: `You are an expert in clean-code refactoring. Improve the **selected code** while preserving behaviour.
  
**Goals (in order):**
1. Remove duplication & dead code.
2. Rename for clarity (APIs, vars, files).
3. Extract smaller functions / classes for single responsibility.
4. Simplify complex logic (early-return, guard clauses).
5. Optimise critical hot-paths if profiling data suggests.

**Deliverables:**
- Explanation table: *before | after | why*.
- Refactored code snippets or diff.
- Risks & how to test migrations.

Keep public APIs stable unless explicitly told otherwise.`,
        category: 'refactor'
    },
    {
        id: 'feature-implementation',
        name: 'Feature Implementation',
        description: 'Add new features to existing code',
        prompt: `You are a full-stack feature developer. Implement the requested feature in the **selected codebase**.
  
**Steps:**
1. Restate feature spec in your own words; list edge-cases.
2. Outline design (modules, data flow, DB changes).
3. Provide production-ready code (assume TypeScript unless files show otherwise).
4. Include input validation, error handling, logging hooks.
5. Suggest/update tests & docs.

Return only:
\`## Design\`, \`## Code\`, \`## Tests\`, \`## Docs/Changelog\`.`,
    category: 'feature'
},
{
    id: 'documentation',
    name: 'Documentation',
    description: 'Generate comprehensive documentation',
    prompt: `You are a technical writer. Produce clear, concise docs for the **selected code**.

**Include:**
- Overview diagram (ASCII or Mermaid).
- Public API reference (params, returns, examples).
- Architecture & data flow section.
- Setup / installation / quick-start.
- Contribution & style guidelines.

Structure with level-2 Markdown headings. Avoid repeating obvious code comments.`,
        category: 'documentation'
    },
    {
        id: 'performance-optimization',
        name: 'Performance Optimization',
        description: 'Optimize code for better performance',
        prompt: `You are a performance engineer. Optimize the **selected code** for speed & memory.
  
**Workflow:**
1. Identify hotspots.
2. Recommend algorithmic improvements (and justify).
3. Optimise memory allocations / I/O patterns.
4. Propose caching or batching if safe.
5. Show how to benchmark the perfomance and what is the estimated improvement.

Return a Markdown report plus code diff blocks.`,
        category: 'analysis'
    },
    {
        id: 'security-audit',
        name: 'Security Audit',
        description: 'Security analysis and vulnerability assessment',
        prompt: `You are an application security auditor. Review the **selected files** for vulnerabilities.
  
**Checklist:**
- OWASP Top-10 categories.
- Dependency scan hints (e.g. known CVEs).
- Data exposure & privacy issues.
- Authentication / authorisation flaws.
- Injection vectors & unsafe eval/dynamic code.

For each finding, rate severity (low/med/high/crit) and suggest a patch or mitigation. Finish with a risk matrix table.`,
        category: 'analysis'
    },
    {
        id: 'testing',
        name: 'Test Generation',
        description: 'Generate unit tests and test strategies',
        prompt: `You are a test-automation guru. Create high-coverage tests for the **selected code**.
  
**Tasks:**
1. Identify critical paths & edge-cases.
2. Write unit tests (use the dominant framework in repo).
3. Draft integration/E2E test outline if relevant.
4. Provide mock/stub guidance.
5. Include coverage expectations (target ≥ 80%).

Output sections: \`## Unit Tests\`, \`## Integration Plan\`. Respond with code blocks only for test files.`,
        category: 'feature'
    }
];