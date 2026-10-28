# LaundryBot

LaundryBot is an intentionally simple Discord bot that helps my family of six communicate laundry
status. It tracks the current cycle and posts a live status card with buttons. The bot stores
status in Oracle DB tables and updates its presence with the current laundry state.

**Features**
- `/laundry` slash command that posts the interactive status card.
- "I Flipped It" and "Mark Laundry Completed" buttons to update status.
- Automatic notifications when a laundry cycle should be done.
- Presence updates reflecting the current availability and ETA.

**Core Flow**
1. Run `/laundry` to post the status card in the laundry channel.
2. Click "I Flipped It" to start a cycle and schedule a notification.
3. The bot edits its presence and keeps the status card current.

**Project Structure**
- `src/laundryBot.ts` entrypoint and Discord client setup.
- `src/commands` slash command and component handlers.
- `src/services` UI, notifications, presence, and message helpers.
- `src/db` Oracle data access and business logic.
- `db` SQL scripts for schema setup and updates.
- `build` compiled output (do not edit directly).

**Prerequisites**
- Node.js `>=24` and npm `>=11` (see `package.json` engines).
- Oracle DB access (tables defined in `db`).
- Discord bot token and permissions to send and delete messages in the target channel.

**Environment Variables**
- `BOT_TOKEN` Discord bot token.
- `ORACLE_USER` Oracle DB username.
- `ORACLE_PASSWORD` Oracle DB password.
- `ORACLE_CONNECT_STRING` Oracle connection string.

**Database**
Table definitions live in the `db` directory. Apply the SQL files in order when setting up a fresh
database. New schema changes should be added as new dated SQL files.

**Run Locally**
```bash
npm install
npm run dev
```

**Build and Run**
```bash
npm run build
npm run start
```

**Docker**
The bot ships as a container image published to GHCR on every push to `main` (see
`.github/workflows/docker-publish.yml`).

Deploy with Docker Compose:
```bash
docker compose up -d
```

This runs two services:
- `bot` the LaundryBot container, pulling `ghcr.io/merph518/laundry-bot:latest`
- `watchtower` (the maintained `nickfedor/watchtower` fork) polls for new image versions every
  5 minutes and auto-updates the running container

The image has a `HEALTHCHECK`: the bot refreshes `/tmp/laundrybot.heartbeat` every 30 seconds while
connected, and `docker ps` shows the container unhealthy when that stops. Docker does not restart an
unhealthy container by itself.

Place your `.env` file (see Environment Variables above) next to `docker-compose.yml`.

**Useful Scripts**
- `npm run dev` run from source with tsx and reload on change.
- `npm run lint` run ESLint.
- `npm run compile` type-check only.

**Claude Code Skills**
The `general` and `voice` skills come from [Overmind](https://github.com/merph518/Overmind),
copied into `.claude/att-docs/` at the release that `.claude/att-docs.lock` pins. LaundryBot's own
extensions of those skills live in `.claude/skills/`.
- Never edit `.claude/att-docs/` by hand. `scripts/overmind-check.sh` fails when it differs from
  the pin.
- To move the pin, run `scripts/overmind-sync.sh <tag>`, commit the result, and open one pull
  request for it.
- `.claude/settings.json` turns off the user-level `general` plugin so only one copy of
  `implement` loads.

**Notes**
- The status card uses Discord components v2; the bot sends messages with
  `MessageFlags.IsComponentsV2`.
- The bot deletes the most recent LaundryBot status post before sending a new one so the channel
  stays clean.
