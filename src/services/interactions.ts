import {
  type ButtonInteraction,
  type CommandInteraction,
  MessageFlags,
  type StringSelectMenuInteraction,
} from "discord.js";

const UNKNOWN_INTERACTION_CODE = 10062;
const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

type DeferrableInteraction =
  | CommandInteraction
  | ButtonInteraction
  | StringSelectMenuInteraction;

interface InteractionOptions {
  // Only the user who triggered the interaction sees the reply.
  isPrivate: boolean;
}

/**
 * Defers the reply, then runs `handler`. An interaction Discord has already expired is dropped
 * quietly, and any error from the handler is logged and answered with a short message instead of
 * leaving the user on "thinking...".
 */
export async function runInteraction(
  interaction: DeferrableInteraction,
  options: InteractionOptions,
  handler: () => Promise<void>,
): Promise<void> {
  try {
    await interaction.deferReply(options.isPrivate ? { flags: MessageFlags.Ephemeral } : undefined);
  } catch (error) {
    if ((error as { code?: number }).code === UNKNOWN_INTERACTION_CODE) {
      return;
    }

    throw error;
  }

  try {
    await handler();
  } catch (error) {
    console.error("Interaction handler failed.", error);
    try {
      await interaction.editReply({ content: GENERIC_ERROR_MESSAGE, components: [] });
    } catch (replyError) {
      console.error("Could not send the interaction error reply.", replyError);
    }
  }
}
