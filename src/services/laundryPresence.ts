import { ActivityType, Client } from "discord.js";
import { DateTime } from "luxon";
import { buildLaundrySummary, getLaundryStatus } from "../db/laundryStatus.js";
import { startPoller, type StopPoller } from "./poller.js";

const PRESENCE_INTERVAL_MS = 30_000;
const PRESENCE_FORCE_REFRESH_INTERVAL_MS = 60 * 60 * 1000;
let lastPresenceText = "";

export function startLaundryPresencePoller(client: Client): StopPoller {
  const stopRefresh = startPoller("laundry-presence", PRESENCE_INTERVAL_MS, () => (
    updateLaundryPresence(client)
  ));
  const stopForcedRefresh = startPoller(
    "laundry-presence-forced",
    PRESENCE_FORCE_REFRESH_INTERVAL_MS,
    () => updateLaundryPresence(client, true),
  );

  return async () => {
    await Promise.all([stopRefresh(), stopForcedRefresh()]);
  };
}

export async function updateLaundryPresence(client: Client, force = false): Promise<void> {
  try {
    const statusRow = await getLaundryStatus();
    const summary = buildLaundrySummary(statusRow);
    const presenceText = buildPresenceText(summary.statusKey, summary.estimatedFreeByDate);

    if (!client.user || (!force && presenceText === lastPresenceText)) {
      return;
    }

    client.user.setPresence({
      activities: [{ name: presenceText, type: ActivityType.Watching }],
      status: "online",
    });
    lastPresenceText = presenceText;
  } catch (error) {
    console.error("Failed to update LaundryBot presence.", error);
  }
}

function buildPresenceText(
  statusKey: "available" | "busy" | "maintenance" | "unknown",
  estimatedFreeByDate: Date | null,
): string {
  switch (statusKey) {
    case "available":
      return "Laundry: available";
    case "maintenance":
      return "Laundry: maintenance";
    case "busy": {
      if (!estimatedFreeByDate) {
        return "Laundry: in progress";
      }

      const eta = DateTime.fromJSDate(estimatedFreeByDate)
        .toLocal()
        .toLocaleString(DateTime.TIME_SIMPLE);
      return `Laundry: in progress - ETA ${eta}`;
    }
    default:
      return "Laundry: unknown";
  }
}
