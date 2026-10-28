import { DateTime, Settings } from "luxon";
import { beforeAll, describe, expect, it } from "vitest";
import { LOAD_DURATION_MINUTES } from "../config.js";
import {
  buildLaundrySummary,
  estimateDoneAt,
  formatLaundryTimestamp,
  type LaundryStatusRow,
} from "./laundryStatus.js";

// Newer ICU versions put a narrow no-break space before AM/PM.
const normalize = (text: string): string => text.replace(/\s/g, " ");

const STARTED_AT = new Date("2026-01-02T15:00:00Z");
const EXPECTED_DONE_AT = new Date("2026-01-02T16:25:00Z");

function row(overrides: Partial<LaundryStatusRow>): LaundryStatusRow {
  return {
    STATUS: "available",
    UPDATED_AT: STARTED_AT,
    UPDATED_BY_NAME: "Sam",
    ...overrides,
  };
}

beforeAll(() => {
  Settings.defaultZone = "UTC";
  Settings.defaultLocale = "en-US";
});

describe("buildLaundrySummary", () => {
  it("reports an unknown state when nothing is recorded", () => {
    const summary = buildLaundrySummary(null);

    expect(summary.statusKey).toBe("unknown");
    expect(summary.statusLine).toBe("No laundry status recorded yet.");
    expect(summary.estimatedFreeByDate).toBeNull();
  });

  it("reports maintenance as unavailable", () => {
    const summary = buildLaundrySummary(row({ STATUS: "maintenance" }));

    expect(summary.statusKey).toBe("maintenance");
    expect(summary.estimatedFreeBy).toBe("Not available");
  });

  it("treats any other status as available now", () => {
    const summary = buildLaundrySummary(row({ STATUS: "available" }));

    expect(summary.statusKey).toBe("available");
    expect(summary.estimatedFreeBy).toBe("Now");
    expect(summary.statusLine).toBe("");
    expect(summary.updatedByName).toBe("Sam");
  });

  it("uses the stored expected finish time while a cycle runs", () => {
    const summary = buildLaundrySummary(
      row({ STATUS: "in_use", STARTED_AT, EXPECTED_DONE_AT }),
    );

    expect(summary.statusKey).toBe("busy");
    expect(normalize(summary.estimatedFreeBy)).toBe("4:25 PM");
    expect(normalize(summary.statusLine)).toBe(
      "Current wash/dry cycle should be complete by 4:25 PM.",
    );
    expect(summary.estimatedFreeByDate).toEqual(EXPECTED_DONE_AT);
  });

  it("estimates the finish from the start time when none is stored", () => {
    const summary = buildLaundrySummary(row({ STATUS: "in_use", STARTED_AT }));

    expect(summary.estimatedFreeByDate).toEqual(EXPECTED_DONE_AT);
  });

  it("says a cycle is in progress when no time is known", () => {
    const summary = buildLaundrySummary(row({ STATUS: "in_use" }));

    expect(summary.statusKey).toBe("busy");
    expect(summary.statusLine).toBe("Current wash/dry cycle is in progress.");
    expect(summary.estimatedFreeByDate).toBeNull();
  });

  it("falls back to Unknown when nobody is recorded as the updater", () => {
    const summary = buildLaundrySummary(row({ UPDATED_BY_NAME: null }));

    expect(summary.updatedByName).toBe("Unknown");
    expect(summary.updatedByUserId).toBeNull();
  });
});

describe("estimateDoneAt", () => {
  it("adds the cycle length to the start time", () => {
    const expected = DateTime.fromJSDate(STARTED_AT)
      .plus({ minutes: LOAD_DURATION_MINUTES })
      .toJSDate();

    expect(estimateDoneAt(STARTED_AT)).toEqual(expected);
  });

  it("returns null without a start time", () => {
    expect(estimateDoneAt(null)).toBeNull();
    expect(estimateDoneAt(undefined)).toBeNull();
  });
});

describe("formatLaundryTimestamp", () => {
  it("shows a placeholder for a missing value", () => {
    expect(formatLaundryTimestamp(null)).toBe("Not set");
  });
});
