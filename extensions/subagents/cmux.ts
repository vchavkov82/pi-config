import { execSync } from "node:child_process";

export function isCmuxAvailable(): boolean {
  return !!process.env.CMUX_SOCKET_PATH;
}

export function shellEscape(s: string): string {
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

/**
 * Create a new cmux terminal surface. Returns the surface ref (e.g. "surface:42").
 */
export function createSurface(name: string): string {
  const out = execSync(`cmux new-surface --type terminal --name ${shellEscape(name)}`, {
    encoding: "utf8",
  }).trim();
  // Output: "OK surface:42 pane:42 workspace:3"
  const match = out.match(/surface:\d+/);
  if (!match) {
    throw new Error(`Unexpected cmux new-surface output: ${out}`);
  }
  return match[0];
}

/**
 * Send a command string to a cmux surface. Appends \n to execute.
 */
export function sendCommand(surface: string, command: string): void {
  execSync(`cmux send --surface ${shellEscape(surface)} ${shellEscape(command + "\n")}`, {
    encoding: "utf8",
  });
}

/**
 * Read the screen contents of a cmux surface.
 */
export function readScreen(surface: string, lines = 50): string {
  return execSync(
    `cmux read-screen --surface ${shellEscape(surface)} --lines ${lines}`,
    { encoding: "utf8" }
  );
}

/**
 * Close a cmux surface.
 */
export function closeSurface(surface: string): void {
  execSync(`cmux close-surface --surface ${shellEscape(surface)}`, {
    encoding: "utf8",
  });
}

/**
 * Poll a surface until the __SUBAGENT_DONE_N__ sentinel appears.
 * Returns the process exit code embedded in the sentinel.
 * Throws if the signal is aborted before the sentinel is found.
 */
export async function pollForExit(
  surface: string,
  signal: AbortSignal,
  options: { interval: number; onTick?: (elapsed: number) => void }
): Promise<number> {
  const start = Date.now();

  while (true) {
    if (signal.aborted) {
      throw new Error("Aborted while waiting for subagent to finish");
    }

    const screen = readScreen(surface, 5);
    const match = screen.match(/__SUBAGENT_DONE_(\d+)__/);
    if (match) {
      return parseInt(match[1], 10);
    }

    const elapsed = Math.floor((Date.now() - start) / 1000);
    options.onTick?.(elapsed);

    await new Promise<void>((resolve, reject) => {
      if (signal.aborted) return reject(new Error("Aborted"));
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      }, options.interval);
      function onAbort() {
        clearTimeout(timer);
        reject(new Error("Aborted"));
      }
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }
}
