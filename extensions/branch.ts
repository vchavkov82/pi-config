import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { getMarkdownTheme } from "@mariozechner/pi-coding-agent";
import { Box, Markdown, Text } from "@mariozechner/pi-tui";

type BranchEntry = {
	type: string;
	id: string;
	parentId: string | null;
	summary?: string;
	[key: string]: unknown;
};

type BranchInfo = {
	count: number;
	totalChars: number;
	estimatedTokens: number;
	contextPercent: number | null;
	summaries: { index: number; chars: number; tokens: number; preview: string }[];
};

function getBranchInfo(ctx: ExtensionContext): BranchInfo {
	const leafId = ctx.sessionManager.getLeafId();
	if (!leafId) return { count: 0, totalChars: 0, estimatedTokens: 0, contextPercent: null, summaries: [] };

	const path = ctx.sessionManager.getBranch(leafId) as BranchEntry[];
	const summaries: BranchInfo["summaries"] = [];
	let totalChars = 0;
	let branchIndex = 0;

	for (const entry of path) {
		if (entry.type === "branch_summary" && entry.summary) {
			branchIndex++;
			const chars = entry.summary.length;
			const tokens = Math.ceil(chars / 4);
			totalChars += chars;
			const preview = entry.summary.slice(0, 120).replace(/\n/g, " ").trim();
			summaries.push({ index: branchIndex, chars, tokens, preview: preview + (chars > 120 ? "…" : "") });
		}
	}

	const estimatedTokens = Math.ceil(totalChars / 4);

	// Get context usage for percentage calculation
	let contextPercent: number | null = null;
	const usage = ctx.getContextUsage();
	if (usage && usage.contextWindow > 0) {
		contextPercent = (estimatedTokens / usage.contextWindow) * 100;
	}

	return { count: summaries.length, totalChars, estimatedTokens, contextPercent, summaries };
}

function formatTokens(tokens: number): string {
	if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
	return `${tokens}`;
}

function updateBranchStatus(ctx: ExtensionContext) {
	if (!ctx.hasUI) return;

	const info = getBranchInfo(ctx);

	if (info.count === 0) {
		ctx.ui.setStatus("branch-chain", undefined);
		return;
	}

	const tokenStr = formatTokens(info.estimatedTokens);
	const pctStr = info.contextPercent !== null ? ` (${info.contextPercent.toFixed(1)}%)` : "";
	const label = info.count === 1
		? `🌿 1 branch · ~${tokenStr} tokens${pctStr}`
		: `🌿 ${info.count} branches · ~${tokenStr} tokens${pctStr}`;

	ctx.ui.setStatus("branch-chain", ctx.ui.theme.fg("muted", label));
}

export default function (pi: ExtensionAPI) {
	// --- Status tracking ---

	pi.on("session_start", (_event, ctx) => {
		updateBranchStatus(ctx);
	});

	pi.on("session_tree", (_event, ctx) => {
		updateBranchStatus(ctx);
	});

	pi.on("session_switch", (_event, ctx) => {
		updateBranchStatus(ctx);
	});

	pi.on("agent_end", (_event, ctx) => {
		// Re-check after each agent turn since context usage may have changed
		updateBranchStatus(ctx);
	});

	// --- Custom renderer for compressed branch summaries ---

	pi.registerMessageRenderer("branch-compressed", (message, { expanded }, theme) => {
		const details = message.details as { count: number; tokens: number; percent: number | null } | undefined;
		const count = details?.count ?? "?";
		const tokenStr = details?.tokens ? formatTokens(details.tokens) : "?";
		const pctStr = details?.percent !== null && details?.percent !== undefined ? ` · ${details.percent.toFixed(1)}% context` : "";

		const box = new Box(1, 1, (t: string) => theme.bg("customMessageBg", t));

		const label = theme.fg("customMessageLabel", `\x1b[1m[${count}x branches · ~${tokenStr} tokens${pctStr}]\x1b[22m`);
		box.addChild(new Text(label, 0, 0));

		if (expanded) {
			const content = typeof message.content === "string" ? message.content : "";
			const mdTheme = getMarkdownTheme();
			box.addChild(new Markdown("\n" + content, 0, 0, mdTheme, {
				color: (text: string) => theme.fg("customMessageText", text),
			}));
		} else {
			box.addChild(new Text(theme.fg("dim", "  expand to see full summary"), 0, 0));
		}

		return box;
	});

	// --- /branch command ---

	pi.registerCommand("branch", {
		description: "Summarize the current conversation and start a fresh branch",
		handler: async (_args, ctx) => {
			await ctx.waitForIdle();

			const leafId = ctx.sessionManager.getLeafId();
			if (!leafId) {
				ctx.ui.notify("No conversation to branch from", "warning");
				return;
			}

			const path = ctx.sessionManager.getBranch(leafId) as BranchEntry[];
			if (path.length === 0) {
				ctx.ui.notify("No conversation to branch from", "warning");
				return;
			}

			// Find the last branch_summary in the current path, or fall back to root
			let branchFromId: string | null = null;
			for (let i = path.length - 1; i >= 0; i--) {
				if (path[i].type === "branch_summary") {
					branchFromId = path[i].id;
					break;
				}
			}
			if (branchFromId === null) {
				branchFromId = path[0].id;
			}

			if (leafId === branchFromId) {
				ctx.ui.notify("Already at a branch point — nothing to branch from", "info");
				return;
			}

			ctx.ui.notify("Summarizing and branching...", "info");

			const result = await ctx.navigateTree(branchFromId, {
				summarize: true,
			});

			if (result.cancelled) {
				ctx.ui.notify("Branch cancelled", "info");
			} else {
				updateBranchStatus(ctx);
			}
		},
	});

	// --- /compress command ---

	pi.registerCommand("compress", {
		description: "Compress all branch summaries into a single summary, starting fresh from root",
		handler: async (_args, ctx) => {
			await ctx.waitForIdle();

			const info = getBranchInfo(ctx);

			if (info.count < 2) {
				ctx.ui.notify(
					info.count === 0
						? "No branch summaries to compress"
						: "Only 1 branch summary — nothing to compress",
					"info",
				);
				return;
			}

			const tokenStr = formatTokens(info.estimatedTokens);
			const pctStr = info.contextPercent !== null ? ` (${info.contextPercent.toFixed(1)}% of context)` : "";
			const ok = await ctx.ui.confirm(
				"Compress branches",
				`Compress ${info.count} branch summaries (~${tokenStr} tokens${pctStr}) into one?`,
			);
			if (!ok) return;

			// Collect all branch summary texts
			const leafId = ctx.sessionManager.getLeafId()!;
			const path = ctx.sessionManager.getBranch(leafId) as BranchEntry[];

			const allSummaries: string[] = [];
			for (const entry of path) {
				if (entry.type === "branch_summary" && entry.summary) {
					allSummaries.push(entry.summary);
				}
			}

			// Find root entry to navigate to
			const rootId = path[0].id;

			// Navigate to root with summarize + custom instructions that combine all summaries
			const combinedInput = allSummaries
				.map((s, i) => `--- Branch ${i + 1} ---\n${s}`)
				.join("\n\n");

			const compressInstructions = [
				"You are compressing multiple branch summaries into a single coherent summary.",
				"The user has been working across several conversation branches. Each branch summary below captures what happened in that branch.",
				"Create ONE combined summary that:",
				"- Preserves all important context, decisions, and progress",
				"- Removes redundancy between branches",
				"- Maintains chronological order where possible",
				"- Uses the same structured format (## Goal, ## Progress, ## Key Decisions, ## Next Steps)",
				"- Notes which items are from which branch when relevant",
				"",
				"Here are the branch summaries to combine:",
				"",
				combinedInput,
			].join("\n");

			ctx.ui.notify("Compressing branch summaries...", "info");

			const result = await ctx.navigateTree(rootId, {
				summarize: true,
				customInstructions: compressInstructions,
				replaceInstructions: true,
			});

			if (result.cancelled) {
				ctx.ui.notify("Compress cancelled", "info");
			} else {
				updateBranchStatus(ctx);
				ctx.ui.notify(
					`Compressed ${info.count} branches into 1`,
					"success",
				);
			}
		},
	});

	// --- /branches command (inspect) ---

	pi.registerCommand("branches", {
		description: "Show branch summary chain details",
		handler: async (_args, ctx) => {
			const info = getBranchInfo(ctx);

			if (info.count === 0) {
				ctx.ui.notify("No branch summaries in current path", "info");
				return;
			}

			const lines: string[] = [];
			for (const s of info.summaries) {
				const tokenStr = formatTokens(s.tokens);
				lines.push(`  ${s.index}. ~${tokenStr} tokens — ${s.preview}`);
			}

			const totalStr = formatTokens(info.estimatedTokens);
			const pctStr = info.contextPercent !== null ? ` (${info.contextPercent.toFixed(1)}% context)` : "";
			const header = `🌿 ${info.count} branch${info.count === 1 ? "" : "es"} · ~${totalStr} tokens${pctStr}`;

			ctx.ui.notify(header + "\n" + lines.join("\n"), "info");
		},
	});
}
