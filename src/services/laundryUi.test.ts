import { Settings } from "luxon";
import { beforeAll, describe, expect, it } from "vitest";
import type { LaundryStatusRow } from "../db/laundryStatus.js";
import {
  buildLaundryComponents,
  buildLaundryDisplayPayload,
  getCompleteButtonId,
  getLaundryButtonId,
  LAUNDRY_COMPONENT_IDS,
} from "./laundryUi.js";

const AVAILABLE: LaundryStatusRow = {
  STATUS: "available",
  UPDATED_AT: new Date("2026-01-02T15:00:00Z"),
  UPDATED_BY_NAME: "Sam",
};
const BUSY: LaundryStatusRow = {
  ...AVAILABLE,
  STATUS: "in_use",
  EXPECTED_DONE_AT: new Date("2026-01-02T16:25:00Z"),
};

function buttonIds(row: LaundryStatusRow | null): (string | undefined)[] {
  return buildLaundryComponents(row).flatMap((actionRow) => (
    actionRow.toJSON().components.map((component) => (
      (component as { custom_id?: string }).custom_id
    ))
  ));
}

beforeAll(() => {
  Settings.defaultZone = "UTC";
  Settings.defaultLocale = "en-US";
});

describe("buildLaundryComponents", () => {
  it("offers only the flip button when the machine is free or unknown", () => {
    expect(buttonIds(AVAILABLE)).toEqual([getLaundryButtonId()]);
    expect(buttonIds(null)).toEqual([getLaundryButtonId()]);
  });

  it("offers only the complete button while a cycle runs", () => {
    expect(buttonIds(BUSY)).toEqual([getCompleteButtonId()]);
  });
});

describe("LAUNDRY_COMPONENT_IDS", () => {
  it("covers every button on the status card", () => {
    expect(LAUNDRY_COMPONENT_IDS).toEqual(
      new Set([getLaundryButtonId(), getCompleteButtonId()]),
    );
  });
});

describe("buildLaundryDisplayPayload", () => {
  it("attaches the matching banner for each state", () => {
    expect(buildLaundryDisplayPayload(AVAILABLE).files.map((file) => file.name))
      .toEqual(["laundry_is_available_banner.png"]);
    expect(buildLaundryDisplayPayload(BUSY).files.map((file) => file.name))
      .toEqual(["laundry_in_progress_banner.png"]);
    expect(buildLaundryDisplayPayload(null).files).toEqual([]);
  });

  it("puts the prefix in bold at the top of the card", () => {
    const { components } = buildLaundryDisplayPayload(BUSY, "Sam flipped the laundry!");

    expect(JSON.stringify(components)).toContain("**Sam flipped the laundry!**");
  });

  it("shows the finish time while busy", () => {
    const { components } = buildLaundryDisplayPayload(BUSY);

    expect(JSON.stringify(components).replace(/\s/g, " ")).toContain("complete by 4:25 PM");
  });

  it("explains that no status exists yet", () => {
    const { components } = buildLaundryDisplayPayload(null);
    const text = JSON.stringify(components);

    expect(text).toContain("No laundry status recorded yet.");
    expect(text).toContain("*Last updated*");
  });

  it("invites someone to start a load when the machine is free", () => {
    const { components } = buildLaundryDisplayPayload(AVAILABLE);

    expect(JSON.stringify(components)).toContain("I Flipped It");
  });
});
