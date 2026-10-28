import {
  ButtonInteraction,
  CommandInteraction,
  MessageFlags,
  StringSelectMenuInteraction,
} from "discord.js";
import { ButtonComponent, Discord, SelectMenuComponent, Slash } from "discordx";
import { LAUNDRY_CHANNEL_ID } from "../config.js";
import { getActiveHelpRequests, getHelpRequestLabel, resolveHelpRequests } from "../db/laundryHelp.js";
import {
  cancelPendingLaundryNotifications,
  formatLaundryTimestamp,
  getLaundryStatus,
  markLaundryCompleted,
  markLaundryStarted,
} from "../db/laundryStatus.js";
import { runInteraction } from "../services/interactions.js";
import { refreshLaundryCard } from "../services/laundryMessages.js";
import { updateLaundryPresence } from "../services/laundryPresence.js";
import {
  buildHelpDoneSelectMenu,
  buildLaundryComponents,
  buildLaundryDisplayPayload,
  getHelpDoneButtonId,
  getCompleteButtonId,
  getLaundryButtonId,
  parseHelpDoneSelectId,
} from "../services/laundryUi.js";

const LAUNDRY_BUTTON_ID = getLaundryButtonId();
const HELP_DONE_BUTTON_ID = getHelpDoneButtonId();
const COMPLETE_BUTTON_ID = getCompleteButtonId();

@Discord()
export class LaundryCommand {
  @Slash({
    name: "laundry",
    description: "Show the LaundryBot menu and current Fagerteam laundry status.",
  })
  async laundry(interaction: CommandInteraction): Promise<void> {
    await runInteraction(interaction, { isPrivate: false }, async () => {
      const [statusRow, helpRequests] = await Promise.all([
        getLaundryStatus(),
        getActiveHelpRequests(),
      ]);
      const { components: displayComponents, files } = buildLaundryDisplayPayload(
        statusRow,
        helpRequests,
      );
      const components = buildLaundryComponents(statusRow, helpRequests);

      await interaction.editReply({
        components: [...displayComponents, ...components],
        files,
        flags: MessageFlags.IsComponentsV2,
      });
      await updateLaundryPresence(interaction.client);
    });
  }

  @ButtonComponent({ id: LAUNDRY_BUTTON_ID })
  async flipLaundry(interaction: ButtonInteraction): Promise<void> {
    await runInteraction(interaction, { isPrivate: true }, async () => {
      const userName = interaction.user.username;
      const { expectedDoneAt } = await markLaundryStarted(
        interaction.user.id,
        userName,
        LAUNDRY_CHANNEL_ID,
      );
      const channel = interaction.channel ?? interaction.message.channel;
      await refreshLaundryCard(interaction.client, channel, `${userName} flipped the laundry!`);
      await interaction.editReply({
        content: `Laundry started. Estimated done: ${formatLaundryTimestamp(expectedDoneAt)}.`,
      });
    });
  }

  @ButtonComponent({ id: HELP_DONE_BUTTON_ID })
  async markHelped(interaction: ButtonInteraction): Promise<void> {
    await runInteraction(interaction, { isPrivate: true }, async () => {
      const helpRequests = await getActiveHelpRequests();
      if (!helpRequests.length) {
        await interaction.editReply({ content: "No active help requests right now." });
        return;
      }

      const menuRow = buildHelpDoneSelectMenu(interaction.message.id, helpRequests);

      await interaction.editReply({
        content: "Select the help requests you completed.",
        components: [menuRow],
      });
    });
  }

  @ButtonComponent({ id: COMPLETE_BUTTON_ID })
  async markLaundryDone(interaction: ButtonInteraction): Promise<void> {
    await runInteraction(interaction, { isPrivate: true }, async () => {
      await markLaundryCompleted(interaction.user.username);
      await cancelPendingLaundryNotifications();
      const channel = interaction.channel ?? interaction.message.channel;
      await refreshLaundryCard(interaction.client, channel, "Laundry cycle has been completed!");
      await interaction.editReply({ content: "Laundry marked as completed." });
    });
  }

  @SelectMenuComponent({ id: /laundry_help_done_select:.+/ })
  async submitHelpCompletion(interaction: StringSelectMenuInteraction): Promise<void> {
    await runInteraction(interaction, { isPrivate: true }, async () => {
      const messageId = parseHelpDoneSelectId(interaction.customId);
      const requestIds = interaction.values.map((value) => Number(value))
        .filter((value) => !Number.isNaN(value));

      const existingRequests = await getActiveHelpRequests();
      const completedLabels = existingRequests
        .filter((request) => requestIds.includes(request.ID))
        .map((request) => getHelpRequestLabel(request.REQUEST_TYPE));
      await resolveHelpRequests(requestIds);

      if (messageId && interaction.channel) {
        if (completedLabels.length) {
          await refreshLaundryCard(
            interaction.client,
            interaction.channel,
            `${interaction.user.username} helped by completing: ${completedLabels.join(", ")}`,
          );
        } else {
          await updateLaundryPresence(interaction.client);
        }
      }

      await interaction.editReply({
        content: "Thanks! Marked those requests as completed.",
        components: [],
      });
    });
  }
}
