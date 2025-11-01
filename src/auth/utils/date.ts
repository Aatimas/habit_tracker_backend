// Returns a YYYY-MM-DD string in local timezone
export function toLocalISO(date: Date = new Date()): string {
	const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000; // minutes -> ms
	const local = new Date(date.getTime() - tzOffsetMs);
	return local.toISOString().split("T")[0];
}
