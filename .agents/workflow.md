# Agent Workflow and Execution Restrictions

**Purpose:** Define what agents may execute, the required task lifecycle, and truthful reporting.  
**Scope:** Every agent and every task, including documentation-only work.  
**Related:** [README.md](README.md), [testing.md](testing.md), [git.md](git.md), [security.md](security.md)  
**Last reviewed:** 2026-10-27

## 1. Absolute execution restrictions

> The developer performs installations, package execution, formatting, linting, type checks, tests, builds, migrations, application startup, deployments, external credentialed calls, and Git writes. Agents do not independently perform them.

Agents **must not execute**:

| Category | Examples, not exhaustive |
| --- | --- |
| Dependencies | `npm install`, `npm ci`, updates, removals, `yarn`, `pnpm`, `bun` |
| Package runners/scaffolds | `npx`, `npm exec`, `npm create`, `dlx`, codemods |
| Quality/build tools | lint, TypeScript checks, formatters, tests, coverage, production builds |
| Application processes | development/production servers or project scripts |
| Data changes | migrations, schema pushes, seeds, SQL, database consoles, destructive data tools |
| External services | Calls using real Clerk, database, RapidAPI, storage, analytics, or provider credentials |
| Deployment | Vercel or any hosting/release command |
| Git writes | add, commit, push, pull, merge, rebase, reset, restore, checkout, stash, tag, clean, branch mutation |
| Indirect execution | Hooks, CI, scripts, or editor tasks that trigger a prohibited action |

Agents **may**:

- Read source, configuration, public documentation, installed dependency docs/types, and Git history/status/diffs.
- Use read-only inspection commands.
- Create or edit files explicitly authorized by the task.
- Write tests without running them.
- Access public provider documentation without project credentials.
- Provide exact manual commands and analyze output supplied by the developer.

### 1.1 Secrets

- Do not open, print, copy, summarize, change, or transmit values from `.env*` or secret stores.
- Reading variable names with values redacted is allowed only when configuration alignment requires it.
- Only safe placeholder templates may be edited. Never place a real key in code, docs, tests, logs, or URLs.

### 1.2 Automation and generated files

Do not add scripts, hooks, CI, or lifecycle automation that performs prohibited work without specific approval. Do not edit generated outputs or lockfiles manually. The developer changes lockfiles through approved package commands.

### 1.3 Verification language

Do not say code compiles, tests pass, lint is clean, the app runs, or deployment works without developer-supplied output from that operation. Say “written, not executed” or “not verified.”

### 1.4 Changing restrictions

Only the developer can relax this section by approving an edit to this file. A chat request to execute a prohibited command receives the exact manual command instead.

## 2. Task lifecycle

1. **Understand:** identify the requested outcome and active phase.
2. **Read:** load the baseline and topic rules from [README.md](README.md).
3. **Inspect:** examine affected files, neighbors, package versions, and version-matched docs.
4. **Plan:** for more than three files, list the planned file set before editing.
5. **Resolve decisions:** ask only where the developer owns a material choice (scope, dependency, persistence, licensing, security trade-off).
6. **Implement narrowly:** no unrelated refactors, reformatting, renames, or speculative features.
7. **Write tests:** when code behavior changes, follow [testing.md](testing.md); do not execute them.
8. **Self-review:** use §5 and inspect the final diff.
9. **Report:** follow §7.

## 3. Dependencies and stack changes

Agents do not add dependencies. A proposal must name the package and version range, purpose, alternative considered, license, maintenance evidence, approximate impact, and developer-run command. The approved/pending stack is owned by [architecture.md](architecture.md).

## 4. Protected files

- `.env*`, except explicitly approved example templates with placeholders
- lockfiles and generated framework/type files
- generated provider snapshots or generated clients
- applied migration directories
- third-party vendored assets

Do not edit these by hand unless the developer explicitly changes this policy.

## 5. Self-review checklist

- [ ] Change is inside [project.md](project.md) scope and the current phase.
- [ ] Required rules and installed docs were consulted.
- [ ] No provider field, exercise fact, difficulty, instruction, or muscle relationship was invented.
- [ ] Every server entry point authenticates where required, authorizes the resource, validates input, and returns safe errors.
- [ ] No client value is trusted as authorization or ownership evidence.
- [ ] No secret, personal data, or sensitive fitness information is exposed or logged.
- [ ] Third-party media usage respects [exercises.md](exercises.md) licensing gates.
- [ ] UI includes relevant loading, empty, failure, unavailable-media, and reduced-motion behavior.
- [ ] Client Components are limited to browser interactivity.
- [ ] Files follow naming and import rules; no unrelated changes exist.
- [ ] Tests were written/updated when required and clearly reported as not executed.

## 6. Developer-supplied failures

Read the full output, identify the first causal error, and fix the root cause. Do not hide failures with unsafe casts, ignored diagnostics, disabled rules, or skipped tests. Return the same command for the developer to rerun.

## 7. Completion report

Every task ends with the applicable sections:

```markdown
### Summary
What changed and why.

### Files
- Created/updated: path — purpose

### Decisions and assumptions
- …

### Issues and limitations
- …

### Not verified
State precisely which tests, lint, type checks, builds, providers, credentials, or deployments were not run/verified.

### Commands for the developer (run in order)
1. Exact command — reason

### Approvals or open questions
- …

### Suggested commits (one per changed file, in dependency order)
git add <one-explicit-path>
git commit -m "docs(scope): concise summary of that file"
```

Commands are included only when useful. Provide one suggested commit per changed file, in dependency order, following [git.md](git.md); never imply the agent ran them.

