import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout, Card, Button, Modal, FormField } from './components';

function App() {
  const [regName, setRegName] = useState('');
  const [regDes, setRegDes] = useState('');
  const [errors, setErrors] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [hubReady, setHubReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadEvents() {
    try {
      const response = await fetch(`http://localhost:${import.meta.env.VITE_PORT}/getEvents`);
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
    loadEvents();
    const timer = setTimeout(() => setHubReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  async function addEvent(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);

    const fullDate = new Date().toJSON().slice(0, 10);
    const fullDateWTime = new Date().toJSON().slice(0, 19).replace(/T/g, ' ');

    try {
      const response = await fetch(`http://localhost:${import.meta.env.VITE_PORT}/addEvent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          date: fullDate,
          description: regDes,
          created_at: fullDateWTime,
        }),
      });
      const data = await response.json();

      if ('errors' in data) {
        setErrors(data.errors.map((err) => err.msg));
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

  return (
    <Layout>
      <div className="flex w-full flex-col items-center gap-6">
        <Button onClick={() => setFormOpen(true)} size="lg">
          Create Event
        </Button>

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
