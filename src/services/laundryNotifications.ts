import { Client } from "discordx";
import { NOTIFICATION_POLL_INTERVAL_MS } from "../config.js";
import {
  getPendingLaundryNotifications,
  markLaundryCompleted,
  markLaundryNotificationFailed,
  markLaundryNotificationSent,
} from "../db/laundryStatus.js";
import { refreshLaundryCard } from "./laundryMessages.js";
import { startPoller, type StopPoller } from "./poller.js";

export function startLaundryNotificationPoller(client: Client): StopPoller {
  return startPoller("laundry-notifications", NOTIFICATION_POLL_INTERVAL_MS, () => (
    processLaundryNotifications(client)
  ));
}

export async function processLaundryNotifications(client: Client): Promise<void> {
  const pending = await getPendingLaundryNotifications();

  for (const notification of pending) {
    try {
      const channel = await client.channels.fetch(notification.CHANNEL_ID);
      if (!channel || !channel.isTextBased() || !("send" in channel)) {
        await markLaundryNotificationFailed(
          notification.ID,
          "Channel not found or not text-based.",
        );
        continue;
      }

      await markLaundryCompleted();
      await refreshLaundryCard(client, channel, "Laundry cycle has been completed!");
      await markLaundryNotificationSent(notification.ID);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await markLaundryNotificationFailed(notification.ID, message);
    }
  }
}
