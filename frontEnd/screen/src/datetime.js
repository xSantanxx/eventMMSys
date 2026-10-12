/** Browser timezone, e.g. America/New_York */
export function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Format Date → value for <input type="datetime-local"> */
export function toDatetimeLocalValue(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** datetime-local string → ISO UTC for the API */
export function datetimeLocalToIso(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

export function formatEventWhen(iso, timezone) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone || undefined,
    });
  } catch {
    return new Date(iso).toLocaleString();
  }
}

export function attendeesToCsv(attendees) {
  const header = ['name', 'email', 'checked_in'];
  const rows = attendees.map((a) => [
    csvEscape(a.name),
    csvEscape(a.email),
    a.checked_in ? 'yes' : 'no',
  ]);
  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
