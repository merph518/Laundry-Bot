You may only edit files in the current working directory.
You may only use non-destructive git commands. Never force-push, and never rewrite the history of a
branch that is already pushed.
After every changeset you make, run `npm run lint`, `npm run compile` and `npm test`, each with a
30 second timeout, and fix what they report.
A worktree starts without `node_modules`. Run `npm ci` in it once before the first check.
`build/` is generated output and is ignored by git. Never edit it by hand.
Review `eslint.config.ts` and follow all rules outlined there. The `ephemeral: true` option is banned
by lint; use `flags: MessageFlags.Ephemeral`.
Research current best practices for Discord.js, DiscordX and TypeScript so your approach is not out
of date.
Aim for clean, centralized patterns instead of duplicating magic numbers or flags across files.
Shared values live in `src/config.ts`, status strings in `src/db/statuses.ts`, and the defer-and-catch
pattern for interactions in `src/services/interactions.ts`.
Comments and log strings describe how the code works now. Never contrast current behavior with what
the code used to do, and never name an issue, pull request or session in them.

## Database

Never edit an existing `.sql` file in `db/`. They have already been run. Add a new file named with
today's date as `YYYYMMDD_name.sql`, and say in the pull request that it must run before the bot
version that needs it is deployed.
Table definitions live in `db/`.

## Discord commands

Slash command options must list every required option before any optional one. Discord rejects a
command otherwise with `DiscordAPIError[50035]` and `APPLICATION_COMMAND_OPTIONS_REQUIRED_INVALID`.

## Vendored skills

`.claude/att-docs/` is a pinned copy of the Overmind skills. Never edit it by hand. Move the pin with
`scripts/overmind-sync.sh <tag>`, and check it with `scripts/overmind-check.sh`. LaundryBot's own
extensions live in `.claude/skills/`.

## Working style

Do not remind the user about local WSL or compile limitations. Assume they run the npm commands
themselves unless they ask.
