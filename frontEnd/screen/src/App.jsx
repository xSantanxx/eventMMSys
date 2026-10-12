import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout, Card, Button, Modal, FormField } from './components';
import {
  apiFetch,
  clearSession,
  getStoredOrganizer,
  getToken,
  setSession,
} from './api/client';

function App() {
  const [regName, setRegName] = useState('');
  const [regDes, setRegDes] = useState('');
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
      } catch {
        clearSession();
        setOrganizer(null);
      }
    }
    bootstrap();
    const timer = setTimeout(() => setHubReady(true), 100);
    return () => clearTimeout(timer);
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

    const fullDate = new Date().toJSON().slice(0, 10);
    const fullDateWTime = new Date().toISOString();

    try {
      const response = await apiFetch('/addEvent', {
        method: 'POST',
        body: JSON.stringify({
          name: regName,
          date: fullDate,
          description: regDes,
          created_at: fullDateWTime,
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
        setFormOpen(false);
        await loadEvents();
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
        <Card animate className="w-full max-w-md">
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
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex w-full flex-col items-center gap-6">
        <div className="flex w-full max-w-xl items-center justify-between gap-3">
          <p className="truncate text-sm text-text-muted">{organizer.name}</p>
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
            <h1 className="text-xl font-semibold text-text">Events</h1>
            <p className="text-sm text-text-muted">
              {events.length} event{events.length !== 1 ? 's' : ''} available
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
                      to={`/${event.id}`}
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
