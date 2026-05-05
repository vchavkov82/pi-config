import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	pi.on("model_select", async (event, ctx) => {
		ctx.ui.setStatus("model", event.model.id);
	});

	pi.on("thinking_level_select", async (event, ctx) => {
		if (event.level === "off") {
			ctx.ui.setStatus("thinking", undefined);
		} else {
			ctx.ui.setStatus("thinking", `think:${event.level}`);
		}
	});
}
