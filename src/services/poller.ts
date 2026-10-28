export type StopPoller = () => Promise<void>;

/**
 * Runs `task` every `intervalMs`. A tick is skipped while the previous one is still running,
 * and a thrown error is logged so it never becomes an unhandled rejection. The returned function
 * stops the schedule and resolves once any tick already running has finished.
 */
export function startPoller(
  name: string,
  intervalMs: number,
  task: () => Promise<void>,
): StopPoller {
  let inFlight: Promise<void> | null = null;

  const timer = setInterval(() => {
    if (inFlight) {
      return;
    }

    inFlight = task()
      .catch((error: unknown) => {
        console.error(`Poller "${name}" failed.`, error);
      })
      .finally(() => {
        inFlight = null;
      });
  }, intervalMs);

  return async () => {
    clearInterval(timer);
    await inFlight;
  };
}
