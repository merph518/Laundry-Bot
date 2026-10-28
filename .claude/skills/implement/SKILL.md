---
name: implement
description: >-
  Implement a LaundryBot GitHub issue end to end: read it, label it
  `In Progress`, work it on its own branch in a worktree, pass lint and
  compile, open a linked pull request, review that pull request itself, then
  hand it to the user. Use when asked to implement, work on, pick up, or start
  an issue by number - "/implement 12", "work issue 12", "start on #12".
---

# Implement

## Base

Read
[the general skill](../../att-docs/plugins/general/skills/implement/SKILL.md)
first and follow it, except where this file overrides it. The general skill is the
vendored copy pinned by `.claude/att-docs.lock`; never edit it here.

## Paths

| Placeholder | Value here |
| --- | --- |
| `<asking-note>` | Every question goes through `AskUserQuestion`, with the recommended answer first |
| `<in-progress-label>` | `In Progress` |
| `<ready-label>` | `Manual Review Needed` |
| `<label-script>` | `gh issue edit <N> --add-label "<label>"` or `--remove-label "<label>"`, then `gh issue view <N> --json labels --jq '[.labels[].name]'` |
| `<labels-note>` | Overrides, Section 2 |
| `<area-label-rule>` | None. LaundryBot has no area labels |
| `<reference-docs>` | `AGENTS.md`, `README.md`, the table docs in `db/`, and the patterns in the reference bot under `/reference` |
| `<ownership-unit>` | The commands, services, or tables the issue names |
| `<ownership-rules>` | Overrides, Section 3 |
| `<main-checkout>` | `~/Code/LaundryBot` |
| `<worktree-script>` | Overrides, Section 3 |
| `<edit-guard>` | None. Check `pwd` before every write |
| `<dependency-setup>` | `npm ci` in the worktree when `node_modules` is missing |
| `<shell-text-note>` | Commit messages and pull request bodies are written to the scratchpad and passed with `-F` or `--body-file` |
| `<branch-types>` | `feat`, `fix`, `chore`, `docs` |
| `<default-branch>` | `main` |
| `<follow-up-note>` | File the finding as its own issue with `gh issue create` and name it in the pull request body |
| `<sampling-note>` | Not used. Lint and compile cover the whole project |
| `<discovery-rules>` | Not used. LaundryBot has no test data discovery |
| `<schema-source>` | The `.sql` files and table docs in `db/` |
| `<project-exclusion>` | Not used |
| `<writing-rules>` | Comments and log strings describe how the code works now, never name an issue, pull request, or session |
| `<repo-constraints>` | Overrides, Section 4 |
| `<test-accounts>` | Not used |
| `<static-checks>` | `npm run lint` and `npm run compile`, each with a 30 second timeout, plus `scripts/overmind-check.sh`. The final pass is the same three |
| `<pr-checks>` | None. The repository has no CI, so the static checks above are the only checks |
| `<test-dispatch>` | None. There is no test suite or runner; see Overrides, Section 6 |
| `<test-run-rules>` | Not used |
| `<shared-env>` | The Discord server and database the bot runs against. Nothing in this skill writes to them |
| `<branch-age-note>` | Before the pull request, `git fetch origin` and merge `origin/main` when the branch is behind it |
| `<run-watch>` | None. There are no runs to wait on; watch the pull request with `gh pr view` when the user says it merged |
| `<baseline-rules>` | Not used |
| `<artifact-read>` | Not used |
| `<failure-snapshot>` | Not used |
| `<deviation-note>` | Not used. LaundryBot has no functional specs to deviate from |
| `<deviation-records>` | Not used |
| `<fix-cycle-budget>` | Three attempts at the same lint or compile error, then stop and report what was tried |
| `<investigation-log>` | Not used |
| `<mergeability-note>` | `gh pr view <N> --json mergeable,mergeStateStatus`; a conflict is resolved by merging `origin/main` into the branch |
| `<self-review>` | The `code-review` skill on the pull request number, at most three passes, fixing real bugs and noting nitpicks in the body |
| `<ready-signal>` | Overrides, Section 9 |
| `<skip-ledger>` | Not used |
| `<instructions-file>` | `AGENTS.md` |
| `<post-merge-checks>` | None |
| `<pairing>` | None |
| `<merge-cleanup>` | The desktop app removes the worktree when the session is archived |

## Overrides

### Section 2, the label

The `In Progress` and `Manual Review Needed` labels already exist; never create
another label to claim an issue. A label edit counts only when the read-back shows
it. When the read-back does not, retry once, then stop and report it.

### Section 3, branching

LaundryBot runs one session per issue. Read the open `In Progress` issues and the
open pull requests' file lists before branching, and defer to a session that
already holds the same commands or tables.

The desktop app gives each session its own worktree under `.claude/worktrees/`.
Cut the branch inside it rather than with a script:

```bash
git fetch origin && git switch -c <type>/issue-<N>-<slug> origin/main
```

Push it with `git push -u origin <branch>` so the upstream is the new branch, not
`main`.

### Section 4, constraints

Every change follows `AGENTS.md` and `eslint.config.ts`. These are the rules that
keep coming up:

- Never edit an existing `.sql` file. Add a new one named `YYYYMMDD_name.sql` with
  today's date.
- Use `flags: MessageFlags.Ephemeral` for ephemeral replies, never the deprecated
  `ephemeral` option.
- Slash command options list every required option before any optional one.
- Import or define every helper before it is used, and leave no unused imports or
  variables behind.
- Never edit or delete `build/`.
- Put shared values and flags in a central helper instead of repeating them.
- Never edit `.claude/att-docs/`. Move the pin with `scripts/overmind-sync.sh <tag>`.

### Section 6, runtime checks

The repository has no automated tests and no runner. Replace all of step 6 with
this: after every changeset, run `npm run lint` and `npm run compile`, each with a
30 second timeout, and fix what they report. Do not start the bot. The user runs it
themselves, so the final report says that no runtime check was run and lists what
the user should try in Discord to see the change working.

### Section 7, the pull request

Before opening the pull request, update `COMMIT-HISTORY.md` from `git log` so it
includes this branch's commits.

### Section 9, the ready signal

Once the pull request is open, the static checks have passed, and the self review
has ended, add `Manual Review Needed` to the pull request with
`gh pr edit <N> --add-label "Manual Review Needed"`, read it back, and end the
report with:

```
PULL REQUEST <N> IS READY FOR YOUR REVIEW
```

Withhold both while any static check is red or the self review loop is still going.

## Added gates

- `npm run lint` and `npm run compile` pass, each within a 30 second timeout.
- `scripts/overmind-check.sh` passes.
- `COMMIT-HISTORY.md` includes the branch's commits.

## Repository notes

- [AGENTS.md](../../../AGENTS.md): the standing rules for this repository.
- [implement-with-speech](../implement-with-speech/SKILL.md): this skill with
  spoken replies.
