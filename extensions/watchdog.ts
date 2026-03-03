import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // State
  let lastActivityTimestamp: number = Date.now();
  let consecutiveInterventions: number = 0;
  let enabled: boolean = true;
  let checkIntervalMs: number = 5 * 60 * 1000; // 5 minutes
  let stuckThresholdMs: number = 5 * 60 * 1000; // same as check interval
  const maxInterventions: number = 3;

  let checkInterval: ReturnType<typeof setInterval> | null = null;
  let sessionCtx: any = null;

  function updateActivity() {
    lastActivityTimestamp = Date.now();
    consecutiveInterventions = 0;
  }

  function getIntervalMinutes(): number {
    return Math.round(checkIntervalMs / 60_000);
  }

  function updateStatusBar() {
    if (!sessionCtx) return;
    if (enabled) {
      sessionCtx.ui.setStatus("watchdog", `🐵 ${getIntervalMinutes()}m`);
    } else {
      sessionCtx.ui.setStatus("watchdog", "🙈");
    }
  }

  function startTimer(ctx: any) {
    if (checkInterval) clearInterval(checkInterval);
    checkInterval = setInterval(async () => {
      if (!enabled || !ctx) return;

      // CRITICAL: Idle agent is never stuck — skip entirely
      if (ctx.isIdle()) return;

      const timeSinceActivity = Date.now() - lastActivityTimestamp;

      // Recent activity — no problem
      if (timeSinceActivity < stuckThresholdMs) return;

      // Phase 1: Inactivity detected — placeholder for Phase 2 judge call
      consecutiveInterventions++;
      console.log(
        `[Watchdog] No activity for ${Math.round(timeSinceActivity / 1000)}s (intervention #${consecutiveInterventions}/${maxInterventions}). Phase 2 judge call goes here.`
      );

      if (consecutiveInterventions >= maxInterventions) {
        console.log("[Watchdog] Max interventions reached. Disabling watchdog.");
        enabled = false;
        updateStatusBar();
      }
    }, checkIntervalMs);
  }

  // Activity tracking events
  pi.on("turn_end", async (_event, _ctx) => {
    updateActivity();
  });

  pi.on("tool_execution_end", async (_event, _ctx) => {
    updateActivity();
  });

  pi.on("tool_execution_update", async (_event, _ctx) => {
    updateActivity();
  });

  pi.on("message_end", async (_event, _ctx) => {
    updateActivity();
  });

  pi.on("agent_end", async (_event, _ctx) => {
    // Agent finished normally — reset activity so watchdog knows it's safe
    updateActivity();
  });

  pi.on("session_start", async (_event, ctx) => {
    sessionCtx = ctx;
    lastActivityTimestamp = Date.now();
    consecutiveInterventions = 0;
    updateStatusBar();
    startTimer(ctx);
  });

  pi.on("session_shutdown", async () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
    sessionCtx = null;
  });

  pi.registerCommand("watchdog", {
    description:
      "Toggle watchdog or set interval in minutes (e.g., /watchdog off, /watchdog on, /watchdog 3)",
    handler: async (args, ctx) => {
      sessionCtx = ctx;
      const arg = (args ?? "").trim().toLowerCase();

      if (arg === "off") {
        enabled = false;
        updateStatusBar();
        return "Watchdog disabled (🙈).";
      }

      if (arg === "on" || arg === "") {
        enabled = !enabled;
        updateStatusBar();
        return enabled
          ? `Watchdog enabled (🐵 ${getIntervalMinutes()}m).`
          : "Watchdog disabled (🙈).";
      }

      const minutes = parseInt(arg, 10);
      if (!isNaN(minutes) && minutes > 0) {
        checkIntervalMs = minutes * 60_000;
        stuckThresholdMs = checkIntervalMs;
        enabled = true;
        updateStatusBar();
        // Restart timer with new interval
        startTimer(ctx);
        return `Watchdog set to ${minutes}m interval (🐵 ${minutes}m).`;
      }

      return `Unknown argument: "${arg}". Usage: /watchdog [off|on|<minutes>]`;
    },
  });
}
