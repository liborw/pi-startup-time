import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const STATE_KEY = "startup-time";

type StartupMeasurement = {
	reason: string;
	elapsedMs: number;
	timestamp: number;
};

function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms.toFixed(ms < 100 ? 1 : 0)}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

function findLatestMeasurement(entries: Array<{ type: string; customType?: string; data?: StartupMeasurement }>): StartupMeasurement | null {
	for (let i = entries.length - 1; i >= 0; i--) {
		const entry = entries[i];
		if (entry.type === "custom" && entry.customType === STATE_KEY && entry.data) return entry.data;
	}
	return null;
}

export default function (pi: ExtensionAPI): void {
	const bootAt = process.hrtime.bigint();
	let lastMeasurement: StartupMeasurement | null = null;

	function measure(reason: string): StartupMeasurement {
		return {
			reason,
			elapsedMs: Number(process.hrtime.bigint() - bootAt) / 1e6,
			timestamp: Date.now(),
		};
	}

	function saveMeasurement(measurement: StartupMeasurement): void {
		lastMeasurement = measurement;
		pi.appendEntry(STATE_KEY, measurement);
	}

	function publishStatus(ctx: { ui: { setStatus(key: string, text: string | undefined): void; theme: { fg(color: string, text: string): string } } }): void {
		if (!lastMeasurement) return;
		ctx.ui.setStatus(
			"startup-time",
			ctx.ui.theme.fg("dim", `Startup: ${formatDuration(lastMeasurement.elapsedMs)} (${lastMeasurement.reason})`),
		);
	}

	pi.on("session_start", async (event, ctx) => {
		if (event.reason !== "startup" && event.reason !== "reload") return;

		const measurement = measure(event.reason);
		saveMeasurement(measurement);
		publishStatus(ctx);

		if (ctx.hasUI) {
			ctx.ui.notify(`pi startup: ${formatDuration(measurement.elapsedMs)} (${event.reason})`, "info");
		}
	});

	pi.registerCommand("startup-time", {
		description: "Show the most recent pi startup time",
		handler: async (_args, ctx) => {
			const measurement = lastMeasurement ?? findLatestMeasurement(ctx.sessionManager.getEntries());
			if (!measurement) {
				ctx.ui.notify("No startup measurement available yet.", "warning");
				return;
			}

			lastMeasurement = measurement;
			publishStatus(ctx);
			ctx.ui.notify(`Last startup: ${formatDuration(measurement.elapsedMs)} (${measurement.reason})`, "info");
		},
	});
}
