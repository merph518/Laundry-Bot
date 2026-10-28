import "dotenv/config";
import { dirname, importx } from "@discordx/importer";
import { IntentsBitField } from "discord.js";
import { Client } from "discordx";
import { startLaundryNotificationPoller } from "./services/laundryNotifications.js";
import { startLaundryPresencePoller, updateLaundryPresence } from "./services/laundryPresence.js";
import type { StopPoller } from "./services/poller.js";

export const bot: Client = new Client({
  intents: [IntentsBitField.Flags.Guilds],
  silent: false,
});

const stopPollers: StopPoller[] = [];

bot.once("clientReady", async () => {
  await bot.guilds.fetch();
  await bot.initApplicationCommands();
  stopPollers.push(startLaundryNotificationPoller(bot), startLaundryPresencePoller(bot));
  await updateLaundryPresence(bot);
  console.log("LaundryBot online.");
});

bot.on("interactionCreate", async (interaction) => {
  await bot.executeInteraction(interaction);
});

async function run(): Promise<void> {
  const token: string | undefined = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error("Could not find BOT_TOKEN in your environment");
  }

  await importx(
    `${dirname(import.meta.url)}/{events,commands}/**/*.{command,handler}.{ts,js}`,
  );

  await bot.login(token);
}

function shutdown(signal: string): void {
  console.log(`Received ${signal}, shutting down.`);
  for (const stop of stopPollers) {
    stop();
  }

  void bot.destroy().finally(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection.", reason);
});

run().catch((error: unknown) => {
  console.error("LaundryBot failed to start.", error);
  process.exit(1);
});
