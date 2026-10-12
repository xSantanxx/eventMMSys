import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout, Card, Button, FormField, SelectField } from './components';
import {
  apiFetch,
  apiUrl,
  getPublicRegisterUrl,
  getToken,
} from './api/client';
import { attendeesToCsv, formatEventWhen } from './datetime';

const POLL_MS = 4000;

/** Organizer event dashboard: schedule, capacity, live counts, attendees, audit. */
function Event() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [registered, setRegistered] = useState(0);
  const [checkedIn, setCheckedIn] = useState(0);
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState('live');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copyState, setCopyState] = useState('');
  const [settingsMsg, setSettingsMsg] = useState('');
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [attendeeQuery, setAttendeeQuery] = useState('');
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [attendeesError, setAttendeesError] = useState('');
  const [logs, setLogs] = useState([]);
  const [undoBusyId, setUndoBusyId] = useState('');

  const shareUrl = getPublicRegisterUrl(id);

  useEffect(() => {
    if (!getToken()) {
      navigate('/org', { replace: true, state: { from: `/org/events/${id}` } });
    }
  }, [id, navigate]);

  function applyEvent(event) {
    setName(event.name);
    setDesc(event.description);
    setStartsAt(event.starts_at || event.date);
    setEndsAt(event.ends_at || '');
    setTimezone(event.timezone || 'UTC');
    setRegistered(event.registered);
    setCheckedIn(event.checked_in);
    setCapacity(event.capacity == null ? '' : String(event.capacity));
    setStatus(event.status || 'live');
  }

  async function loadEvent({ quiet = false } = {}) {
    if (!quiet) {
      setLoading(true);
      setError('');
    }
    try {
      const response = await fetch(apiUrl(`/${id}`));
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        if (!quiet) setError('This event could not be found.');
        return;
      }

      applyEvent(data[0]);
    } catch (err) {
      console.error(err);
      if (!quiet) setError('Failed to load event details.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  async function loadAttendees(query = attendeeQuery) {
    if (!getToken()) return;
    setAttendeesLoading(true);
    setAttendeesError('');
    try {
      const path = query.trim()
        ? `/${id}/attendees?q=${encodeURIComponent(query.trim())}`
        : `/${id}/attendees`;
      const response = await apiFetch(path);
      if (response.status === 401) {
        navigate('/org');
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        setAttendeesError(data.error || 'Failed to load attendees');
        setAttendees([]);
        return;
      }
      setAttendees(Array.isArray(data.attendees) ? data.attendees : []);
    } catch (err) {
      console.error(err);
      setAttendeesError('Failed to load attendees');
    } finally {
      setAttendeesLoading(false);
    }
  }

  async function loadLogs() {
    if (!getToken()) return;
    try {
      const response = await apiFetch(`/${id}/check-in-log`);
      const data = await response.json();
      if (response.ok) {
        setLogs(Array.isArray(data.logs) ? data.logs : []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadEvent();
    loadAttendees('');
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadEvent({ quiet: true });
      loadAttendees(attendeeQuery);
      loadLogs();
    }, POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, attendeeQuery]);

  const filteredHint = useMemo(() => {
    if (!attendeeQuery.trim()) return `${attendees.length} attendee(s)`;
    return `${attendees.length} match(es)`;
  }, [attendees.length, attendeeQuery]);

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState('Copied!');
    } catch {
      setCopyState('Copy failed — select the link manually.');
    }
    setTimeout(() => setCopyState(''), 2000);
  }

  function exportCsv() {
    const csv = attendeesToCsv(attendees);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name || 'attendees'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveSettings(e) {
    e.preventDefault();
    setSettingsBusy(true);
    setSettingsMsg('');
    try {
      const response = await apiFetch(`/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          capacity: capacity === '' ? null : Number(capacity),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setSettingsMsg(data.error || 'Failed to save settings');
        return;
      }
      if (data.event) applyEvent(data.event);
      setSettingsMsg('Settings saved');
    } catch (err) {
      console.error(err);
      setSettingsMsg('Failed to save settings');
    } finally {
      setSettingsBusy(false);
      setTimeout(() => setSettingsMsg(''), 2500);
    }
  }

  async function undoCheckIn(attendeeId) {
    setUndoBusyId(attendeeId);
    try {
      const response = await apiFetch(
        `/${id}/attendees/${attendeeId}/undo-checkin`,
        { method: 'POST' }
      );
      const data = await response.json();
      if (!response.ok) {
        setAttendeesError(data.error || 'Failed to undo check-in');
        return;
      }
      if (typeof data.registered === 'number') setRegistered(data.registered);
      if (typeof data.checked_in === 'number') setCheckedIn(data.checked_in);
      await loadAttendees(attendeeQuery);
      await loadLogs();
    } catch (err) {
      console.error(err);
      setAttendeesError('Failed to undo check-in');
    } finally {
      setUndoBusyId('');
    }
  }

  return (
    <Layout>
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/org')}
            className="self-start"
          >
            ← Back to your events
          </Button>
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-primary">
            Organizer · live
          </span>
        </div>

        <Card>
          <Card.Header>
            <h1 className="text-xl font-semibold text-text">
              {loading ? 'Loading...' : name}
            </h1>
            {!loading && !error && (
              <p className="text-sm text-text-muted">
                Organizer event dashboard (auto-refreshes)
              </p>
            )}
          </Card.Header>

          <Card.Body>
            {error ? (
              <p className="text-sm text-error">{error}</p>
            ) : loading ? (
              <p className="text-sm text-text-muted">Fetching event information...</p>
            ) : (
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-sm font-medium text-text-muted">Description</p>
                  <p className="mt-1 text-text">{desc}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-background p-4">
                    <p className="text-sm text-text-muted">Starts</p>
                    <p className="mt-1 font-medium text-text">
                      {formatEventWhen(startsAt, timezone)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-background p-4">
                    <p className="text-sm text-text-muted">Ends</p>
                    <p className="mt-1 font-medium text-text">
                      {formatEventWhen(endsAt, timezone)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-background p-4">
                    <p className="text-sm text-text-muted">Registered</p>
                    <p className="mt-1 font-medium text-text">
                      {registered}
                      {capacity !== '' ? ` / ${capacity}` : ''}
                    </p>
                  </div>
                  <div className="rounded-lg bg-background p-4">
                    <p className="text-sm text-text-muted">Signed In</p>
                    <p className="mt-1 font-medium text-text">{checkedIn}</p>
                  </div>
                </div>

                <form
                  onSubmit={saveSettings}
                  className="rounded-lg border border-border bg-background p-4 flex flex-col gap-3"
                >
                  <p className="text-sm font-medium text-text">Registration controls</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <SelectField
                      id="event-status"
                      label="Status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="draft">Draft (hidden from signup)</option>
                      <option value="live">Live (accepting registrations)</option>
                      <option value="closed">Closed</option>
                    </SelectField>
                    <FormField
                      id="event-capacity"
                      label="Capacity (blank = unlimited)"
                      type="number"
                      placeholder="e.g. 100"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="secondary" disabled={settingsBusy}>
                    {settingsBusy ? 'Saving...' : 'Save settings'}
                  </Button>
                  {settingsMsg && (
                    <p className="text-sm text-text-muted">{settingsMsg}</p>
                  )}
                </form>

                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-sm font-medium text-text">
                    Attendee registration link
                  </p>
                  <p className="mt-1 break-all text-sm text-text-muted">{shareUrl}</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button variant="secondary" className="flex-1" onClick={copyShareLink}>
                      Copy link
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1"
                      onClick={() =>
                        window.open(`/e/${id}`, '_blank', 'noopener,noreferrer')
                      }
                    >
                      Preview attendee page
                    </Button>
                  </div>
                  {copyState && (
                    <p className="mt-2 text-sm text-success">{copyState}</p>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={() => navigate(`/org/events/${id}/check-in`)}
                >
                  Open check-in / kiosk
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>

        {!loading && !error && (
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-text">Attendees</h2>
              <p className="text-sm text-text-muted">{filteredHint}</p>
            </Card.Header>
            <Card.Body className="flex flex-col gap-4">
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  loadAttendees(attendeeQuery);
                }}
              >
                <div className="flex-1">
                  <FormField
                    id="attendee-search"
                    label="Search"
                    placeholder="Name or email"
                    value={attendeeQuery}
                    onChange={(e) => setAttendeeQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit" variant="secondary">
                    Search
                  </Button>
                  <Button type="button" variant="ghost" onClick={exportCsv}>
                    Export CSV
                  </Button>
                </div>
              </form>

              {attendeesError && (
                <p className="text-sm text-error">{attendeesError}</p>
              )}
              {attendeesLoading ? (
                <p className="text-sm text-text-muted">Loading attendees...</p>
              ) : attendees.length === 0 ? (
                <p className="text-sm text-text-muted">No attendees yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-background text-text-muted">
                      <tr>
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Email</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {attendees.map((a) => (
                        <tr key={a.id}>
                          <td className="px-3 py-2 text-text">{a.name}</td>
                          <td className="px-3 py-2 text-text">{a.email}</td>
                          <td className="px-3 py-2">
                            <span
                              className={
                                a.checked_in ? 'text-success' : 'text-text-muted'
                              }
                            >
                              {a.checked_in ? 'Checked in' : 'Registered'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {a.checked_in ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={undoBusyId === a.id}
                                onClick={() => undoCheckIn(a.id)}
                              >
                                {undoBusyId === a.id ? 'Undoing...' : 'Undo'}
                              </Button>
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {!loading && !error && (
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-text">Check-in audit log</h2>
              <p className="text-sm text-text-muted">Latest 50 actions</p>
            </Card.Header>
            <Card.Body>
              {logs.length === 0 ? (
                <p className="text-sm text-text-muted">No check-ins yet.</p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {logs.map((log) => (
                    <li key={log.id} className="px-3 py-2 text-sm">
                      <p className="text-text">
                        <span className="font-medium">
                          {log.action === 'undo' ? 'Undo' : 'Check-in'}
                        </span>{' '}
                        · {log.attendee_name}
                      </p>
                      <p className="text-text-muted">
                        {new Date(log.created_at).toLocaleString()}
                        {log.organizer_name ? ` · by ${log.organizer_name}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>
        )}
      </div>
    </Layout>
  );
}

export default Event;
