import { Settings } from "luxon";
import { beforeAll, describe, expect, it } from "vitest";
import { buildPresenceText } from "./laundryPresence.js";

beforeAll(() => {
  Settings.defaultZone = "UTC";
  Settings.defaultLocale = "en-US";
});

describe("buildPresenceText", () => {
  it("names the available and maintenance states", () => {
    expect(buildPresenceText("available", null)).toBe("Laundry: available");
    expect(buildPresenceText("maintenance", null)).toBe("Laundry: maintenance");
    expect(buildPresenceText("unknown", null)).toBe("Laundry: unknown");
  });

  it("shows the ETA while a cycle runs", () => {
    const text = buildPresenceText("busy", new Date("2026-01-02T16:25:00Z"));

    expect(text.replace(/\s/g, " ")).toBe("Laundry: in progress - ETA 4:25 PM");
  });

  it("omits the ETA when none is known", () => {
    expect(buildPresenceText("busy", null)).toBe("Laundry: in progress");
  });
});
