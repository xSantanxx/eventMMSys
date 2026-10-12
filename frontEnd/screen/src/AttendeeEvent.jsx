import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Layout, Card, Button } from './components';
import { apiUrl } from './api/client';
import { formatEventWhen } from './datetime';

/** Public attendee-facing event page (no check-in controls). */
function AttendeeEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [status, setStatus] = useState('live');
  const [capacity, setCapacity] = useState(null);
  const [registered, setRegistered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        setStatus(event.status || 'live');
        setCapacity(event.capacity ?? null);
        setRegistered(event.registered ?? 0);
      } catch (err) {
        console.error(err);
        setError('Failed to load event details.');
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [id]);

  const isFull = capacity != null && registered >= capacity;
  const canRegister = status === 'live' && !isFull;
  const statusMessage =
    status === 'draft'
      ? 'Registration is not open yet.'
      : status === 'closed'
        ? 'Registration is closed.'
        : isFull
          ? 'This event is full.'
          : '';

  return (
    <Layout>
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate('/')} className="self-start">
            ← Home
          </Button>
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-primary">
            Attendee
          </span>
        </div>

        <Card>
          <Card.Header>
            <h1 className="text-xl font-semibold text-text">
              {loading ? 'Loading...' : name}
            </h1>
            {!loading && !error && (
              <p className="text-sm text-text-muted">Event registration</p>
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
                </div>

                {capacity != null && (
                  <p className="text-sm text-text-muted">
                    Spots: {Math.max(capacity - registered, 0)} remaining ({registered}/
                    {capacity})
                  </p>
                )}

                {statusMessage ? (
                  <p className="rounded-lg border border-error/20 bg-error-soft px-3 py-2 text-sm text-error">
                    {statusMessage}
                  </p>
                ) : (
                  <p className="text-sm text-text-muted">
                    Register to receive a QR code by email. Bring that code to the
                    event for check-in.
                  </p>
                )}

                {canRegister ? (
                  <Link to={`/e/${id}/register`} className="block">
                    <Button className="w-full">Register for this event</Button>
                  </Link>
                ) : (
                  <Button className="w-full" disabled>
                    Registration unavailable
                  </Button>
                )}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </Layout>
  );
}

export default AttendeeEvent;
