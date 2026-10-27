# Git Conventions

**Purpose:** Keep history reviewable and prevent agents from mutating repository history.  
**Scope:** Status/diff inspection, commit planning, branches, and repository contents.  
**Related:** [workflow.md](workflow.md), [code-quality.md](code-quality.md)  
**Last reviewed:** 2026-10-27

## 1. Agent boundary

Agents may run read-only Git inspection (`status`, `diff`, `log`, `show`) but never stage, commit, push, pull, merge, rebase, reset, restore, checkout, stash, tag, clean, or create/delete branches. Only the developer performs Git writes.

Never overwrite or revert unrelated working-tree changes. Treat unfamiliar changes as developer-owned. If required work overlaps them and cannot be safely preserved, stop and ask.

## 2. Commit design

Recommend one commit per changed file, in dependency order. This deliberately favors granular review and rollback even when several documentation files form one foundation. Every suggested command names exactly one explicit path—never `git add .`. A file containing inseparable implementation and test concerns should be split into appropriately owned files rather than bundled into a broad commit.

Use Conventional Commit-style messages:

```text
docs(governance): establish fitness engineering rulebook
feat(exercises): add normalized provider adapter
test(exercises): cover provider normalization failures
fix(auth): enforce owner scope in workout action
```

## 3. Content rules

Never commit secrets, `.env` values, credentials, private exports, personal fitness data, build outputs, dependency directories, logs, editor state, unlicensed third-party media, or temporary provider downloads. Lockfiles are committed only after developer-run approved dependency changes.

## 4. Pre-commit developer review

The developer should inspect status/diff, verify no secrets or unrelated changes, run applicable quality commands, and confirm license/attribution for new assets. Suggested commits in completion reports are proposals, not evidence that any Git operation occurred.

