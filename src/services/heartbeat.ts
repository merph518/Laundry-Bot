import { writeFile } from "node:fs/promises";
import type { Client } from "discord.js";
import { HEARTBEAT_FILE, HEARTBEAT_INTERVAL_MS } from "../config.js";
import { startPoller, type StopPoller } from "./poller.js";

/**
 * Touches the heartbeat file while the Discord client is ready. The container healthcheck reads its
 * modification time, so a stalled or disconnected bot stops refreshing it and reads as unhealthy.
 */
export function startHeartbeat(client: Client): StopPoller {
  return startPoller("heartbeat", HEARTBEAT_INTERVAL_MS, async () => {
    if (client.isReady()) {
      await writeFile(HEARTBEAT_FILE, String(Date.now()));
    }
  });
}
