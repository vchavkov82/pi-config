import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";

function sanitizeStatusText(text: string): string {
  return text.replace(/[\r\n\t]/g, " ").replace(/ +/g, " ").trim();
}

function formatTokens(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  if (count < 1000000) return `${Math.round(count / 1000)}k`;
  if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
  return `${Math.round(count / 1000000)}M`;
}

function latestThinkingLevel(entries: readonly any[]): string | undefined {
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    if (entry?.type === "thinking_level_change" && typeof entry.thinkingLevel === "string") {
      return entry.thinkingLevel;
    }
  }
  return undefined;
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    if (!ctx.hasUI) return;

    ctx.ui.setFooter((_tui, theme, footerData) => {
      const unsub = footerData.onBranchChange(() => _tui.requestRender());

      return {
        dispose: unsub,
        invalidate() {},
        render(width: number): string[] {
          let totalInput = 0;
          let totalOutput = 0;
          let totalCacheRead = 0;
          let totalCacheWrite = 0;
          let totalCost = 0;
          const entries = ctx.sessionManager.getEntries();

          for (const entry of entries) {
            if (entry.type !== "message" || entry.message?.role !== "assistant") continue;
            const usage = entry.message.usage;
            if (!usage) continue;
            totalInput += usage.input ?? 0;
            totalOutput += usage.output ?? 0;
            totalCacheRead += usage.cacheRead ?? 0;
            totalCacheWrite += usage.cacheWrite ?? 0;
            totalCost += usage.cost?.total ?? 0;
          }

          const contextUsage = ctx.getContextUsage();
          const contextWindow = contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
          const contextPercentValue = contextUsage?.percent ?? 0;
          const contextPercent = contextUsage?.percent !== null ? contextPercentValue.toFixed(1) : "?";

          let pwd = ctx.sessionManager.getCwd();
          const home = process.env.HOME || process.env.USERPROFILE;
          if (home && pwd.startsWith(home)) pwd = `~${pwd.slice(home.length)}`;

          const branch = footerData.getGitBranch();
          if (branch) pwd = `${pwd} (${branch})`;

          const sessionName = ctx.sessionManager.getSessionName();
          if (sessionName) pwd = `${pwd} • ${sessionName}`;

          const statsParts: string[] = [];
          if (totalInput) statsParts.push(`↑${formatTokens(totalInput)}`);
          if (totalOutput) statsParts.push(`↓${formatTokens(totalOutput)}`);
          if (totalCacheRead) statsParts.push(`R${formatTokens(totalCacheRead)}`);
          if (totalCacheWrite) statsParts.push(`W${formatTokens(totalCacheWrite)}`);

          const usingSubscription = ctx.model ? ctx.modelRegistry.isUsingOAuth(ctx.model) : false;
          if (totalCost || usingSubscription) {
            statsParts.push(`$${totalCost.toFixed(3)}${usingSubscription ? " (sub)" : ""}`);
          }

          const contextPercentDisplay = contextPercent === "?"
            ? `?/${formatTokens(contextWindow)} (auto)`
            : `${contextPercent}%/${formatTokens(contextWindow)} (auto)`;
          if (contextPercentValue > 90) {
            statsParts.push(theme.fg("error", contextPercentDisplay));
          } else if (contextPercentValue > 70) {
            statsParts.push(theme.fg("warning", contextPercentDisplay));
          } else {
            statsParts.push(contextPercentDisplay);
          }

          let statsLeft = statsParts.join(" ");
          if (visibleWidth(statsLeft) > width) statsLeft = truncateToWidth(statsLeft, width, "...");

          const modelName = ctx.model?.id || "no-model";
          let modelText = modelName;
          if (ctx.model?.reasoning) {
            const thinkingLevel = latestThinkingLevel(entries) || "medium";
            modelText = thinkingLevel === "off" ? `${modelName} • thinking off` : `${modelName} • ${thinkingLevel}`;
          }

          if (footerData.getAvailableProviderCount() > 1 && ctx.model) {
            const withProvider = `(${ctx.model.provider}) ${modelText}`;
            if (visibleWidth(statsLeft) + 2 + visibleWidth(withProvider) <= width) {
              modelText = withProvider;
            }
          }

          const extensionStatuses = footerData.getExtensionStatuses();
          const mcpStatus = extensionStatuses.get("mcp");
          const otherStatuses = Array.from(extensionStatuses.entries())
            .filter(([key]) => key !== "mcp")
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, text]) => sanitizeStatusText(text));

          const rightParts = [];
          if (mcpStatus) rightParts.push(sanitizeStatusText(mcpStatus));
          rightParts.push(theme.fg("dim", modelText));
          let rightBlock = rightParts.join("  ");

          const statsLeftWidth = visibleWidth(statsLeft);
          const minPadding = 2;
          let statsLine: string;
          const availableForRight = width - statsLeftWidth - minPadding;

          if (availableForRight > 0) {
            if (visibleWidth(rightBlock) > availableForRight) {
              rightBlock = truncateToWidth(rightBlock, availableForRight, "");
            }
            const padding = " ".repeat(Math.max(minPadding, width - statsLeftWidth - visibleWidth(rightBlock)));
            statsLine = theme.fg("dim", statsLeft) + padding + rightBlock;
          } else {
            statsLine = theme.fg("dim", statsLeft);
          }

          const lines = [
            truncateToWidth(theme.fg("dim", pwd), width, theme.fg("dim", "...")),
            truncateToWidth(statsLine, width, ""),
          ];

          if (otherStatuses.length > 0) {
            lines.push(truncateToWidth(otherStatuses.join(" "), width, theme.fg("dim", "...")));
          }

          return lines;
        },
      };
    });
  });
}
