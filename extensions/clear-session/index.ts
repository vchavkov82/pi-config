export default function clearSessionCommand(pi: any) {
	pi.registerCommand("clear", {
		description: "Start a new empty session (alias for /new)",
		handler: async (_args: string, ctx: any) => {
			await ctx.waitForIdle();
			await ctx.newSession({
				withSession: async (nextCtx: any) => {
					nextCtx.ui.notify("New session started", "success");
				},
			});
		},
	});
}
