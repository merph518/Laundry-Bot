import { type ButtonInteraction, MessageFlags } from "discord.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runInteraction } from "./interactions.js";

function fakeInteraction(deferReply = vi.fn().mockResolvedValue(undefined)) {
  const editReply = vi.fn().mockResolvedValue(undefined);
  const interaction = { deferReply, editReply } as unknown as ButtonInteraction;

  return { interaction, deferReply, editReply };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runInteraction", () => {
  it("defers privately with the ephemeral flag", async () => {
    const { interaction, deferReply } = fakeInteraction();

    await runInteraction(interaction, { isPrivate: true }, async () => undefined);

    expect(deferReply).toHaveBeenCalledWith({ flags: MessageFlags.Ephemeral });
  });

  it("defers publicly without options", async () => {
    const { interaction, deferReply } = fakeInteraction();

    await runInteraction(interaction, { isPrivate: false }, async () => undefined);

    expect(deferReply).toHaveBeenCalledWith(undefined);
  });

  it("drops an interaction Discord no longer knows", async () => {
    const expired = Object.assign(new Error("Unknown interaction"), { code: 10062 });
    const { interaction } = fakeInteraction(vi.fn().mockRejectedValue(expired));
    const handler = vi.fn();

    await runInteraction(interaction, { isPrivate: true }, handler);

    expect(handler).not.toHaveBeenCalled();
  });

  it("rethrows any other deferral error", async () => {
    const failure = new Error("network");
    const { interaction } = fakeInteraction(vi.fn().mockRejectedValue(failure));

    await expect(
      runInteraction(interaction, { isPrivate: true }, async () => undefined),
    ).rejects.toBe(failure);
  });

  it("logs a handler error and answers with a short message", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { interaction, editReply } = fakeInteraction();

    await runInteraction(interaction, { isPrivate: true }, async () => {
      throw new Error("boom");
    });

    expect(logged).toHaveBeenCalled();
    expect(editReply).toHaveBeenCalledWith({
      content: "Something went wrong. Please try again.",
      components: [],
    });
  });

  it("survives a failing error reply", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { interaction, editReply } = fakeInteraction();
    editReply.mockRejectedValue(new Error("cannot edit"));

    await expect(
      runInteraction(interaction, { isPrivate: true }, async () => {
        throw new Error("boom");
      }),
    ).resolves.toBeUndefined();
  });
});
