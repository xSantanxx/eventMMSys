import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout, Card, Button, FormField } from './components';
import {
  apiFetch,
  apiUrl,
  getPublicRegisterUrl,
  getToken,
} from './api/client';
import { attendeesToCsv, formatEventWhen } from './datetime';

/** Organizer event dashboard: schedule, share link, attendees, check-in. */
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copyState, setCopyState] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [attendeeQuery, setAttendeeQuery] = useState('');
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [attendeesError, setAttendeesError] = useState('');

  const shareUrl = getPublicRegisterUrl(id);

  useEffect(() => {
    if (!getToken()) {
      navigate('/org', { replace: true, state: { from: `/org/events/${id}` } });
    }
  }, [id, navigate]);

  useEffect(() => {
    async function loadEvent() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(apiUrl(`/${id}`));
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          setError('This event could not be found.');
          return;
        }

        const event = data[0];
        setName(event.name);
        setDesc(event.description);
        setStartsAt(event.starts_at || event.date);
        setEndsAt(event.ends_at || '');
        setTimezone(event.timezone || 'UTC');
        setRegistered(event.registered);
        setCheckedIn(event.checked_in);
      } catch (err) {
        console.error(err);
        setError('Failed to load event details.');
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [id]);

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

  useEffect(() => {
    loadAttendees('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
            Organizer
          </span>
        </div>

        <Card>
          <Card.Header>
            <h1 className="text-xl font-semibold text-text">
              {loading ? 'Loading...' : name}
            </h1>
            {!loading && !error && (
              <p className="text-sm text-text-muted">Organizer event dashboard</p>
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
                    <p className="mt-1 font-medium text-text">{registered}</p>
                  </div>
                  <div className="rounded-lg bg-background p-4">
                    <p className="text-sm text-text-muted">Signed In</p>
                    <p className="mt-1 font-medium text-text">{checkedIn}</p>
                  </div>
                </div>

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
                  Open check-in scanner
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        )}
      </div>
    </Layout>
  );
}

export default Event;
