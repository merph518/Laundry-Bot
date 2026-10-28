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

const SHUTDOWN_TIMEOUT_MS = 8_000;
const stopPollers: StopPoller[] = [];
let shuttingDown = false;

bot.once("clientReady", async () => {
  try {
    await bot.guilds.fetch();
    await bot.initApplicationCommands();
    stopPollers.push(startLaundryNotificationPoller(bot), startLaundryPresencePoller(bot));
    await updateLaundryPresence(bot);
    console.log("LaundryBot online.");
  } catch (error) {
    console.error("LaundryBot failed to finish starting.", error);
    process.exit(1);
  }
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

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`Received ${signal}, shutting down.`);

  // Let a poll tick that is mid-flight finish, but stay inside Docker's stop grace period.
  const drained = Promise.all(stopPollers.map((stop) => stop()));
  const timedOut = new Promise<void>((resolve) => {
    setTimeout(resolve, SHUTDOWN_TIMEOUT_MS).unref();
  });
  await Promise.race([drained, timedOut]);

  await bot.destroy();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection.", reason);
});

run().catch((error: unknown) => {
  console.error("LaundryBot failed to start.", error);
  process.exit(1);
});
