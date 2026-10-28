import { type Client, MessageFlags, type TextBasedChannel } from "discord.js";
import { getActiveHelpRequests, type LaundryHelpRequestRow } from "../db/laundryHelp.js";
import { getLaundryStatus, type LaundryStatusRow } from "../db/laundryStatus.js";
import { updateLaundryPresence } from "./laundryPresence.js";
import {
  buildLaundryComponents,
  buildLaundryDisplayPayload,
  LAUNDRY_COMPONENT_IDS,
} from "./laundryUi.js";

/**
 * Replaces the bot's last status card in `channel` with one built from the current database
 * state, then brings the bot's presence in line with it.
 */
export async function refreshLaundryCard(
  client: Client,
  channel: TextBasedChannel,
  contentPrefix?: string,
): Promise<void> {
  const [statusRow, helpRequests] = await Promise.all([
    getLaundryStatus(),
    getActiveHelpRequests(),
  ]);

  await deleteRecentLaundryMessage(channel, client.user?.id);
  await sendLaundryStatusMessage(channel, statusRow, helpRequests, contentPrefix);
  await updateLaundryPresence(client);
}

export async function deleteRecentLaundryMessage(
  channel: TextBasedChannel,
  botUserId?: string,
): Promise<void> {
  const messages = await channel.messages.fetch({ limit: 15 });
  const target = messages.find((message) => {
    if (botUserId && message.author.id !== botUserId) {
      return false;
    }

    if (!botUserId && !message.author.bot) {
      return false;
    }

    return messageHasLaundryComponents(message);
  });

  if (target) {
    await target.delete();
  }
}

export async function sendLaundryStatusMessage(
  channel: TextBasedChannel,
  statusRow: LaundryStatusRow | null,
  helpRequests: LaundryHelpRequestRow[],
  contentPrefix?: string,
): Promise<void> {
  if (!("send" in channel)) {
    return;
  }

  const { components: displayComponents, files } = buildLaundryDisplayPayload(
    statusRow,
    helpRequests,
    contentPrefix,
  );
  const components = buildLaundryComponents(statusRow, helpRequests);

  await channel.send({
    components: [...displayComponents, ...components],
    files,
    flags: MessageFlags.IsComponentsV2,
  });
}

function messageHasLaundryComponents(message: { components?: unknown[] }): boolean {
  if (!message.components?.length) {
    return false;
  }

  return message.components.some((row) => {
    const rowComponents = (row as { components?: unknown[] }).components ?? [];
    return rowComponents.some((component) => {
      const customId = (component as { customId?: string }).customId;
      return typeof customId === "string" && LAUNDRY_COMPONENT_IDS.has(customId);
    });
  });
}
