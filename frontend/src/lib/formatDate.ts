/** Parse the date portion of an ISO date string (YYYY-MM-DD). */
function parseVisitDate(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day);
}

/** Format an ISO date string (YYYY-MM-DD) for display. */
export function formatVisitDate(isoDate: string): string {
  const date = parseVisitDate(isoDate);
  if (!date) {
    return isoDate;
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Short card header date, e.g. "Jun 21". */
export function formatVisitDateShort(isoDate: string): string {
  const date = parseVisitDate(isoDate);
  if (!date) {
    return isoDate;
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
