import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Card, Button, Modal, FormField, SelectField } from './components';
import {
  apiFetch,
  clearSession,
  getStoredOrganizer,
  getToken,
  setSession,
} from './api/client';
import {
  browserTimezone,
  datetimeLocalToIso,
  toDatetimeLocalValue,
} from './datetime';

function defaultStartLocal() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return toDatetimeLocalValue(d);
}

function defaultEndLocal() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 3);
  return toDatetimeLocalValue(d);
}

/** Organizer hub: login/register + owned event list. */
function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [regName, setRegName] = useState('');
  const [regDes, setRegDes] = useState('');
  const [regStart, setRegStart] = useState(defaultStartLocal);
  const [regEnd, setRegEnd] = useState(defaultEndLocal);
  const [regCapacity, setRegCapacity] = useState('');
  const [regStatus, setRegStatus] = useState('live');
  const [errors, setErrors] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [hubReady, setHubReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [organizer, setOrganizer] = useState(() => getStoredOrganizer());
  const [authMode, setAuthMode] = useState('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  async function loadEvents() {
    if (!getToken()) {
      setEvents([]);
      return;
    }

    try {
      const response = await apiFetch('/getEvents');
      if (response.status === 401) {
        clearSession();
        setOrganizer(null);
        setEvents([]);
        return;
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        console.error('Failed to load events:', data);
        return;
      }
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      if (!getToken()) return;
      try {
        const response = await apiFetch('/auth/me');
        if (!response.ok) {
          clearSession();
          setOrganizer(null);
          return;
        }
        const data = await response.json();
        setOrganizer(data.organizer);
        await loadEvents();
        const from = location.state?.from;
        if (typeof from === 'string' && from.startsWith('/org/')) {
          navigate(from, { replace: true });
        }
      } catch {
        clearSession();
        setOrganizer(null);
      }
    }
    bootstrap();
    const timer = setTimeout(() => setHubReady(true), 100);
    return () => clearTimeout(timer);
    // Intentionally run once on mount to restore session / deep-link return.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitAuth(e) {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError('');

    try {
      const path = authMode === 'login' ? '/auth/login' : '/auth/register';
      const body =
        authMode === 'login'
          ? { email: authEmail, password: authPassword }
          : { name: authName, email: authEmail, password: authPassword };

      const response = await apiFetch(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (data.errors) {
        setAuthError(data.errors.map((err) => err.msg).join(' '));
        return;
      }
      if (!response.ok) {
        setAuthError(data.error || 'Authentication failed');
        return;
      }

      setSession(data.token, data.organizer);
      setOrganizer(data.organizer);
      setAuthPassword('');
      await loadEvents();
      if (location.state?.from?.startsWith('/org/')) {
        navigate(location.state.from, { replace: true });
      }
    } catch (err) {
      console.error(err);
      setAuthError('Authentication failed');
    } finally {
      setAuthBusy(false);
    }
  }

  async function addEvent(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);

    const startsAt = datetimeLocalToIso(regStart);
    const endsAt = datetimeLocalToIso(regEnd);
    if (!startsAt || !endsAt) {
      setErrors(['Please choose valid start and end times.']);
      setSubmitting(false);
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      setErrors(['End time must be after start time.']);
      setSubmitting(false);
      return;
    }

    try {
      const response = await apiFetch('/addEvent', {
        method: 'POST',
        body: JSON.stringify({
          name: regName,
          description: regDes,
          starts_at: startsAt,
          ends_at: endsAt,
          timezone: browserTimezone(),
          capacity: regCapacity === '' ? null : Number(regCapacity),
          status: regStatus,
          created_at: new Date().toISOString(),
        }),
      });
      const data = await response.json();

      if (response.status === 401) {
        clearSession();
        setOrganizer(null);
        setErrors(['Session expired. Please log in again.']);
        return;
      }

      if ('errors' in data) {
        setErrors(data.errors.map((err) => err.msg));
      } else if (!response.ok) {
        setErrors([data.error || 'Failed to create event']);
      } else {
        setRegName('');
        setRegDes('');
        setRegStart(defaultStartLocal());
        setRegEnd(defaultEndLocal());
        setRegCapacity('');
        setRegStatus('live');
        setFormOpen(false);
        await loadEvents();
        if (data.id) {
          navigate(`/org/events/${data.id}`);
        }
      }
    } catch (err) {
      console.error(err);
      setErrors(['Something went wrong. Please try again.']);
    } finally {
      setSubmitting(false);
    }
  }

  function logout() {
    clearSession();
    setOrganizer(null);
    setEvents([]);
    setFormOpen(false);
  }

  if (!organizer) {
    return (
      <Layout>
        <div className="flex w-full max-w-md flex-col gap-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')}>
              ← Home
            </Button>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-primary">
              Organizer
            </span>
          </div>
          <Card animate className="w-full">
            <Card.Header>
              <h1 className="text-xl font-semibold text-text">
                {authMode === 'login' ? 'Organizer login' : 'Create organizer account'}
              </h1>
              <p className="text-sm text-text-muted">
                Sign in to create events and run QR check-in.
              </p>
            </Card.Header>
            <Card.Body>
              <form onSubmit={submitAuth} className="flex flex-col gap-4">
                {authMode === 'register' && (
                  <FormField
                    id="auth-name"
                    label="Name"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                  />
                )}
                <FormField
                  id="auth-email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
                <FormField
                  id="auth-password"
                  label="Password"
                  type="password"
                  autoComplete={
                    authMode === 'login' ? 'current-password' : 'new-password'
                  }
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />

                {authError && (
                  <div className="rounded-lg border border-error/20 bg-error-soft px-3 py-2">
                    <p className="text-sm text-error">{authError}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={authBusy}>
                  {authBusy
                    ? 'Please wait...'
                    : authMode === 'login'
                      ? 'Log in'
                      : 'Create account'}
                </Button>
              </form>

              <button
                type="button"
                className="mt-4 text-sm text-text-muted hover:text-text"
                onClick={() => {
                  setAuthMode((mode) => (mode === 'login' ? 'register' : 'login'));
                  setAuthError('');
                }}
              >
                {authMode === 'login'
                  ? 'Need an account? Register'
                  : 'Already have an account? Log in'}
              </button>
            </Card.Body>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex w-full flex-col items-center gap-6">
        <div className="flex w-full max-w-xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/')}>
              ← Home
            </Button>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-primary">
              Organizer
            </span>
            <p className="truncate text-sm text-text-muted">{organizer.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={logout}>
              Log out
            </Button>
            <Button onClick={() => setFormOpen(true)} size="lg">
              Create Event
            </Button>
          </div>
        </div>

        <Modal
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setErrors([]);
          }}
          title="Add Event"
        >
          <form onSubmit={addEvent} className="flex flex-col gap-4">
            <FormField
              id="event-name"
              label="Name"
              placeholder="Summer Networking Night"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
            />
            <FormField
              id="event-description"
              label="Description"
              placeholder="Describe your event"
              value={regDes}
              onChange={(e) => setRegDes(e.target.value)}
            />
            <FormField
              id="event-start"
              label="Starts"
              type="datetime-local"
              value={regStart}
              onChange={(e) => setRegStart(e.target.value)}
            />
            <FormField
              id="event-end"
              label="Ends"
              type="datetime-local"
              value={regEnd}
              onChange={(e) => setRegEnd(e.target.value)}
            />
            <p className="text-xs text-text-muted">
              Times use your local timezone ({browserTimezone()}).
            </p>
            <FormField
              id="event-capacity"
              label="Capacity (optional)"
              type="number"
              placeholder="Leave blank for unlimited"
              value={regCapacity}
              onChange={(e) => setRegCapacity(e.target.value)}
            />
            <SelectField
              id="event-status"
              label="Status"
              value={regStatus}
              onChange={(e) => setRegStatus(e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="live">Live</option>
              <option value="closed">Closed</option>
            </SelectField>

            {errors.length > 0 && (
              <div className="rounded-lg border border-error/20 bg-error-soft px-3 py-2">
                {errors.map((msg) => (
                  <p key={msg} className="text-sm text-error">
                    {msg}
                  </p>
                ))}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Event'}
            </Button>
          </form>
        </Modal>

        <Card animate={hubReady} className="max-h-[28rem] overflow-y-auto">
          <Card.Header>
            <h1 className="text-xl font-semibold text-text">Your events</h1>
            <p className="text-sm text-text-muted">
              {events.length} event{events.length !== 1 ? 's' : ''} · share the
              attendee link from each event page
            </p>
          </Card.Header>
          <Card.Body className="p-0">
            {events.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-text-muted">
                No events yet. Create one to get started.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {events.map((event, i) => (
                  <li key={event.id}>
                    <Link
                      to={`/org/events/${event.id}`}
                      className="flex items-center gap-3 px-6 py-4 text-text transition-colors hover:bg-background"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="font-medium">{event.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>
      </div>
    </Layout>
  );
}

export default App;
