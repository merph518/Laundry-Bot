import { fileURLToPath } from "node:url";

// The Discord channel that receives the "laundry is done" card.
export const LAUNDRY_CHANNEL_ID = "1311001731936550952";

// How long one wash and dry cycle is expected to take.
export const LOAD_DURATION_MINUTES = 85;

export const NOTIFICATION_POLL_INTERVAL_MS = 15_000;
export const PRESENCE_INTERVAL_MS = 30_000;
export const PRESENCE_FORCE_REFRESH_INTERVAL_MS = 60 * 60 * 1000;
export const HEARTBEAT_INTERVAL_MS = 30_000;

export const HEARTBEAT_FILE = process.env.HEARTBEAT_FILE ?? "/tmp/laundrybot.heartbeat";

// This file sits one folder below the project root whether it runs from src or from build.
const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
export const BANNER_DIR = `${PROJECT_ROOT}src/assets/images`;
