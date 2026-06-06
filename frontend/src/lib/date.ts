/** Today's date as YYYY-MM-DD (local timezone). */
export function todayIsoDate(): string {
  return isoDateFromDate(new Date());
}

/** Format a local Date as YYYY-MM-DD for the API. */
export function isoDateFromDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parse YYYY-MM-DD as a local calendar date (no UTC shift). */
export function dateFromIsoDate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) {
    return new Date();
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** NHL seasons begin in September (preseason). */
export const NHL_SEASON_START_MONTH = 9;

/** Calendar year when an NHL season begins (e.g. 2025 for the 2025-26 season). */
export function nhlSeasonStartYearFromIsoDate(iso: string): number {
  const match = /^(\d{4})-(\d{2})/.exec(iso);
  if (!match) {
    return new Date().getFullYear();
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  return month >= NHL_SEASON_START_MONTH ? year : year - 1;
}

/** Fan-facing label, e.g. 2025 → "25-26". */
export function formatNhlSeasonLabel(seasonStartYear: number): string {
  const start = seasonStartYear % 100;
  const end = (seasonStartYear + 1) % 100;
  return `${String(start).padStart(2, '0')}-${String(end).padStart(2, '0')}`;
}
