import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { getSupportedThinkingLevels, type ModelThinkingLevel } from "@mariozechner/pi-ai";

const THINKING_LEVELS: ModelThinkingLevel[] = ["off", "minimal", "low", "medium", "high", "xhigh"];

function availableThinkingLevels(ctx: ExtensionContext): ModelThinkingLevel[] {
	if (!ctx.model) return ["off"];
	return getSupportedThinkingLevels(ctx.model);
}

function formatAvailable(levels: readonly ModelThinkingLevel[]): string {
	return levels.join(", ");
}

export default function (pi: ExtensionAPI) {
	function setThinkingLevel(level: ModelThinkingLevel, ctx: ExtensionContext) {
		const available = availableThinkingLevels(ctx);
		if (!available.includes(level)) {
			ctx.ui.notify(`Thinking level "${level}" is not available for this model. Available: ${formatAvailable(available)}`, "warning");
			return;
		}

		pi.setThinkingLevel(level);
		ctx.ui.notify(`Thinking level: ${pi.getThinkingLevel()}`, "info");
	}

	function cycleThinkingLevel(delta: 1 | -1, ctx: ExtensionContext) {
		const available = availableThinkingLevels(ctx);
		if (available.length <= 1) {
			ctx.ui.notify("Current model does not support selectable thinking levels", "warning");
			return;
		}

		const current = pi.getThinkingLevel() as ModelThinkingLevel;
		const currentIndex = available.includes(current) ? available.indexOf(current) : 0;
		const nextIndex = (currentIndex + delta + available.length) % available.length;
		setThinkingLevel(available[nextIndex], ctx);
	}

	pi.registerShortcut("ctrl+shift+up", {
		description: "Increase thinking effort",
		handler: async (ctx) => cycleThinkingLevel(1, ctx),
	});

	pi.registerShortcut("ctrl+shift+down", {
		description: "Decrease thinking effort",
		handler: async (ctx) => cycleThinkingLevel(-1, ctx),
	});

	pi.registerCommand("effort", {
		description: "Set thinking effort for the current model",
		handler: async (args, ctx) => {
			const requested = args.trim().toLowerCase() as ModelThinkingLevel;
			if (requested) {
				if (!THINKING_LEVELS.includes(requested)) {
					ctx.ui.notify(`Unknown effort "${requested}". Use: ${formatAvailable(THINKING_LEVELS)}`, "error");
					return;
				}
				setThinkingLevel(requested, ctx);
				return;
			}

			const available = availableThinkingLevels(ctx);
			if (!ctx.hasUI) return;
			const selected = await ctx.ui.select("Select thinking effort", available);
			if (selected) setThinkingLevel(selected as ModelThinkingLevel, ctx);
		},
	});
}
