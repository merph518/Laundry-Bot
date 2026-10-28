import {
  ButtonInteraction,
  CommandInteraction,
  MessageFlags,
} from "discord.js";
import { ButtonComponent, Discord, Slash } from "discordx";
import { LAUNDRY_CHANNEL_ID } from "../config.js";
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
  buildLaundryComponents,
  buildLaundryDisplayPayload,
  getCompleteButtonId,
  getLaundryButtonId,
} from "../services/laundryUi.js";

const LAUNDRY_BUTTON_ID = getLaundryButtonId();
const COMPLETE_BUTTON_ID = getCompleteButtonId();

@Discord()
export class LaundryCommand {
  @Slash({
    name: "laundry",
    description: "Show the LaundryBot menu and current Fagerteam laundry status.",
  })
  async laundry(interaction: CommandInteraction): Promise<void> {
    await runInteraction(interaction, { isPrivate: false }, async () => {
      const statusRow = await getLaundryStatus();
      const { components: displayComponents, files } = buildLaundryDisplayPayload(statusRow);
      const components = buildLaundryComponents(statusRow);

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
}
