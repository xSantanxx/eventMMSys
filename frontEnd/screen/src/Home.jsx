import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Card, Button, FormField } from './components';
import { extractEventId } from './eventId';

function Home() {
  const navigate = useNavigate();
  const [eventInput, setEventInput] = useState('');
  const [error, setError] = useState('');

  function openAttendeeEvent(e) {
    e.preventDefault();
    const id = extractEventId(eventInput);
    if (!id || id.length < 8) {
      setError('Paste a valid event link or event ID from your organizer.');
      return;
    }
    setError('');
    navigate(`/e/${id}`);
  }

  return (
    <Layout>
      <div className="flex w-full max-w-xl flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-text">Event check-in</h1>
          <p className="mt-2 text-sm text-text-muted">
            Organizers manage events and scan QR codes. Attendees open a shared
            link to register — no account needed.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="h-full">
            <Card.Header>
              <h2 className="text-lg font-semibold text-text">Organizers</h2>
              <p className="text-sm text-text-muted">Host &amp; check in</p>
            </Card.Header>
            <Card.Body className="flex flex-col gap-4">
              <p className="text-sm text-text-muted">
                Create an account, publish events, share registration links, and
                scan attendee QR codes at the door.
              </p>
              <Link to="/org" className="block">
                <Button className="w-full">Go to organizer area</Button>
              </Link>
            </Card.Body>
          </Card>

          <Card className="h-full">
            <Card.Header>
              <h2 className="text-lg font-semibold text-text">Attendees</h2>
              <p className="text-sm text-text-muted">Register only</p>
            </Card.Header>
            <Card.Body className="flex flex-col gap-4">
              <p className="text-sm text-text-muted">
                Use the link your organizer shared, or paste it below to open the
                event.
              </p>
              <form onSubmit={openAttendeeEvent} className="flex flex-col gap-3">
                <FormField
                  id="event-link"
                  label="Event link or ID"
                  placeholder="https://…/e/abc123 or abc123"
                  value={eventInput}
                  onChange={(ev) => setEventInput(ev.target.value)}
                />
                {error && <p className="text-sm text-error">{error}</p>}
                <Button type="submit" variant="secondary" className="w-full">
                  Open event
                </Button>
              </form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default Home;
