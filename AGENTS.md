# GYM Fitness Platform — Agent Instructions

GYM Fitness Platform is a planned mobile-first Next.js application for discovering exercises, learning technique, understanding targeted muscles, and—later—building personal workouts. The product name is temporary.

**The authoritative engineering rulebook is [`.agents/README.md`](.agents/README.md).** This file is only its entry point.

## Before every task

1. Read [`.agents/README.md`](.agents/README.md), [`.agents/workflow.md`](.agents/workflow.md), and [`.agents/project.md`](.agents/project.md).
2. Read the topic documents listed by the rule index for the task.
3. Inspect the files being changed and the installed package documentation. Installed versions and official version-matched documentation override memory.
4. Keep the request inside the approved stack and product phase. Do not add an unrequested feature or silently resolve an open architectural decision.

## Absolute execution restrictions

Agents must not independently install or upgrade dependencies; run package runners, builds, tests, type checks, lint, formatters, migrations, development servers, deployments, external calls with project credentials, or Git write operations. Agents may inspect files, use read-only commands, edit explicitly authorized files, write tests without running them, and provide exact commands for the developer.

Never read, print, modify, or disclose private environment values. Never claim that unexecuted work passed verification. Full policy: [`.agents/workflow.md`](.agents/workflow.md).

## Precedence

1. Execution restrictions in `workflow.md` and security boundaries in `security.md`.
2. The developer's explicit instruction for the current task.
3. The most specific topic rule in `.agents/`.
4. Official documentation matching installed versions.
5. General knowledge.

Only the developer may approve weakening a restriction, changing the stack, or expanding scope. If rule documents conflict, stop and ask.

## Completion

Finish every task with the completion report required by [`.agents/workflow.md`](.agents/workflow.md#7-completion-report), including files changed, decisions, limitations, unverified work, developer-run commands, open approvals, and one suggested commit per changed file.

