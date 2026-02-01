export type TimezoneOption = { name: string; value: string };

function isSupportedUsTimezone(tz: string): boolean {
	return tz === 'UTC' || tz.startsWith('America/');
}

function pad2(n: number): string {
	return String(n).padStart(2, '0');
}

function normalizeGmtOffsetLabel(raw: string | undefined): string | null {
	if (!raw) return null;
	// Common outputs: "GMT", "UTC", "GMT-7", "GMT-07:00", "GMT+1"
	if (raw === 'GMT' || raw === 'UTC') return 'GMT+00:00';

	const match = raw.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
	if (!match) return null;

	const sign = match[1];
	const hours = Number(match[2]);
	const minutes = match[3] ? Number(match[3]) : 0;
	if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

	return `GMT${sign}${pad2(hours)}:${pad2(minutes)}`;
}

function getCurrentGmtOffsetLabel(timeZone: string, date: Date = new Date()): string | null {
	try {
		// Prefer shortOffset when available (more consistently yields "GMT-7" style output)
		const formatter = new Intl.DateTimeFormat('en-US', {
			timeZone,
			hour: '2-digit',
			minute: '2-digit',
			timeZoneName: 'shortOffset' as any,
		});
		const tzPart = formatter.formatToParts(date).find((p) => p.type === 'timeZoneName')?.value;
		return normalizeGmtOffsetLabel(tzPart);
	} catch {
		// Fall back to 'short' which often includes a GMT offset in many environments
		try {
			const formatter = new Intl.DateTimeFormat('en-US', {
				timeZone,
				hour: '2-digit',
				minute: '2-digit',
				timeZoneName: 'short',
			});
			const tzPart = formatter.formatToParts(date).find((p) => p.type === 'timeZoneName')?.value;
			return normalizeGmtOffsetLabel(tzPart);
		} catch {
			return null;
		}
	}
}

function getSupportedTimezones(): string[] {
	const anyIntl = Intl as any;
	const supportedValuesOf = anyIntl?.supportedValuesOf;
	if (typeof supportedValuesOf === 'function') {
		try {
			return supportedValuesOf('timeZone') as string[];
		} catch {
			return [];
		}
	}
	return [];
}

const FALLBACK_TIMEZONES: string[] = [
	'UTC',
	'America/New_York',
	'America/Chicago',
	'America/Denver',
	'America/Los_Angeles',
	'America/Phoenix',
	'America/Anchorage',
	'Pacific/Honolulu',
];

const rawTimezones = getSupportedTimezones();

export const TIMEZONES: TimezoneOption[] = (rawTimezones.length ? rawTimezones : FALLBACK_TIMEZONES)
	.filter((tz) => typeof tz === 'string' && tz.length > 0)
	.filter(isSupportedUsTimezone)
	.sort((a, b) => a.localeCompare(b))
	.map((tz) => {
		const offset = getCurrentGmtOffsetLabel(tz);
		return {
			name: offset ? `${tz} (${offset})` : tz,
			value: tz,
		};
	});

