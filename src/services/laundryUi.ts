import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  SeparatorSpacingSize,
} from "discord.js";
import { DateTime } from "luxon";
import type {
  APIComponentInContainer,
  APIMessageTopLevelComponent,
} from "discord.js";
import { BANNER_DIR } from "../config.js";
import type { LaundryStatusRow } from "../db/laundryStatus.js";
import { buildLaundrySummary } from "../db/laundryStatus.js";

const LAUNDRY_BUTTON_ID = "laundry_flip";
const COMPLETE_BUTTON_ID = "laundry_complete";
// Custom IDs of the buttons on the status card; the card is found again by matching these.
export const LAUNDRY_COMPONENT_IDS: ReadonlySet<string> = new Set([
  LAUNDRY_BUTTON_ID,
  COMPLETE_BUTTON_ID,
]);

const IN_PROGRESS_BANNER = "laundry_in_progress_banner.png";
const AVAILABLE_BANNER = "laundry_is_available_banner.png";

export function buildLaundryComponents(
  row: LaundryStatusRow | null,
): ActionRowBuilder<ButtonBuilder>[] {
  const summary = buildLaundrySummary(row);
  const buttons: ButtonBuilder[] = [];

  if (summary.statusKey !== "busy") {
    buttons.push(new ButtonBuilder()
    .setCustomId(LAUNDRY_BUTTON_ID)
    .setLabel("I Flipped It")
    .setStyle(ButtonStyle.Primary));
  }

  if (summary.statusKey === "busy") {
    buttons.push(new ButtonBuilder()
      .setCustomId(COMPLETE_BUTTON_ID)
      .setLabel("Mark Laundry Completed")
      .setStyle(ButtonStyle.Secondary));
  }

  return [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)];
}

export function buildLaundryDisplayPayload(
  row: LaundryStatusRow | null,
  contentPrefix?: string,
): { components: APIMessageTopLevelComponent[]; files: AttachmentBuilder[] } {
  const summary = buildLaundrySummary(row);
  const footerTime = buildFooterTime(summary.lastUpdatedDate, summary.lastUpdated);
  const isUnknownUpdater = summary.updatedByName === "Unknown";
  const footerText = summary.lastUpdated === "Not available"
    ? "Last updated"
    : isUnknownUpdater
      ? `Last updated at ${footerTime}`
      : `Last updated at ${footerTime} by ${summary.updatedByName}.`;
  const bannerFilename = summary.statusKey === "busy"
    ? IN_PROGRESS_BANNER
    : summary.statusKey === "available"
      ? AVAILABLE_BANNER
      : null;
  const files = bannerFilename
    ? [new AttachmentBuilder(`${BANNER_DIR}/${bannerFilename}`, {
      name: bannerFilename,
    })]
    : [];
  const containerComponents: APIComponentInContainer[] = [];
  const mediaUrl = bannerFilename ? `attachment://${bannerFilename}` : null;

  if (mediaUrl) {
    containerComponents.push({
      type: ComponentType.MediaGallery,
      items: [{ media: { url: mediaUrl } }],
    });
  }

  const statusLines: string[] = [];
  if (contentPrefix) {
    statusLines.push(`**${contentPrefix}**`);
  }
  if (summary.statusKey === "available") {
    statusLines.push(
      "Is there laundry to do? Get it started and click the \"I Flipped It\" button.",
    );
  }
  if (summary.statusLine) {
    statusLines.push(summary.statusLine);
  }

  containerComponents.push(buildTextDisplay(statusLines.join("\n\n")));

  containerComponents.push(buildSeparator());
  containerComponents.push(buildTextDisplay(`*${footerText}*`));

  return {
    components: [
      {
        type: ComponentType.Container,
        components: containerComponents,
      },
    ],
    files,
  };
}

function buildFooterTime(lastUpdatedDate: Date | null, lastUpdatedTime: string): string {
  if (!lastUpdatedDate || lastUpdatedTime === "Not available") {
    return lastUpdatedTime;
  }

  const localDate = DateTime.fromJSDate(lastUpdatedDate).toLocal();
  const isToday = localDate.hasSame(DateTime.local(), "day");
  if (isToday) {
    return lastUpdatedTime;
  }

  const dateLabel = localDate.toLocaleString(DateTime.DATE_MED);
  return `${dateLabel} ${lastUpdatedTime}`;
}

export function getLaundryButtonId(): string {
  return LAUNDRY_BUTTON_ID;
}

export function getCompleteButtonId(): string {
  return COMPLETE_BUTTON_ID;
}

function buildTextDisplay(content: string): APIComponentInContainer {
  return {
    type: ComponentType.TextDisplay,
    content,
  };
}

function buildSeparator(): APIComponentInContainer {
  return {
    type: ComponentType.Separator,
    divider: true,
    spacing: SeparatorSpacingSize.Small,
  };
}
