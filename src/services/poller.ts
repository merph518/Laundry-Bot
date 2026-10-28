export type StopPoller = () => void;

/**
 * Runs `task` every `intervalMs`. A tick is skipped while the previous one is still running,
 * and a thrown error is logged so it never becomes an unhandled rejection.
 */
export function startPoller(
  name: string,
  intervalMs: number,
  task: () => Promise<void>,
): StopPoller {
  let running = false;

  const timer = setInterval(() => {
    if (running) {
      return;
    }

    running = true;
    task()
      .catch((error: unknown) => {
        console.error(`Poller "${name}" failed.`, error);
      })
      .finally(() => {
        running = false;
      });
  }, intervalMs);

  return () => clearInterval(timer);
}
