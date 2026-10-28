import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startPoller } from "./poller.js";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("startPoller", () => {
  it("runs the task on every interval", async () => {
    const task = vi.fn().mockResolvedValue(undefined);
    const stop = startPoller("test", 1000, task);

    await vi.advanceTimersByTimeAsync(3000);

    expect(task).toHaveBeenCalledTimes(3);
    await stop();
  });

  it("skips a tick while the previous one is still running", async () => {
    let finish: () => void = () => undefined;
    const task = vi.fn(() => new Promise<void>((resolve) => {
      finish = resolve;
    }));
    const stop = startPoller("test", 1000, task);

    await vi.advanceTimersByTimeAsync(3000);
    expect(task).toHaveBeenCalledTimes(1);

    finish();
    await vi.advanceTimersByTimeAsync(1000);
    expect(task).toHaveBeenCalledTimes(2);

    finish();
    await stop();
  });

  it("logs a failing task and keeps polling", async () => {
    const error = new Error("database is down");
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const task = vi.fn().mockRejectedValue(error);
    const stop = startPoller("test", 1000, task);

    await vi.advanceTimersByTimeAsync(2000);

    expect(task).toHaveBeenCalledTimes(2);
    expect(logged).toHaveBeenCalledWith('Poller "test" failed.', error);
    await stop();
  });

  it("waits for a running tick when stopped, then runs no more", async () => {
    let finish: () => void = () => undefined;
    const task = vi.fn(() => new Promise<void>((resolve) => {
      finish = resolve;
    }));
    const stop = startPoller("test", 1000, task);
    await vi.advanceTimersByTimeAsync(1000);

    let stopped = false;
    const stopping = stop().then(() => {
      stopped = true;
    });
    await Promise.resolve();
    expect(stopped).toBe(false);

    finish();
    await stopping;
    expect(stopped).toBe(true);

    await vi.advanceTimersByTimeAsync(5000);
    expect(task).toHaveBeenCalledTimes(1);
  });
});
