import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout, Card, Button } from './components';

function Event() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [registered, setRegistered] = useState(0);
  const [checkedIn, setCheckedIn] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEvent() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`http://localhost:${import.meta.env.VITE_PORT}/${id}`);
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          setError('This event could not be found.');
          return;
        }

        const event = data[0];
        setName(event.name);
        setDesc(event.description);
        setDate(new Date(event.date).toLocaleDateString('en-US'));
        setTime(new Date(event.created_at).toLocaleTimeString('en-US'));
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

  return (
    <Layout>
      <div className="flex w-full flex-col gap-4">
        <Button variant="ghost" onClick={() => navigate('/')} className="self-start">
          ← Back to events
        </Button>

        <Card>
          <Card.Header>
            <h1 className="text-xl font-semibold text-text">{loading ? 'Loading...' : name}</h1>
            {!loading && !error && (
              <p className="text-sm text-text-muted">Event details</p>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-background p-4">
                    <p className="text-sm text-text-muted">Date</p>
                    <p className="mt-1 font-medium text-text">{date}</p>
                  </div>
                  <div className="rounded-lg bg-background p-4">
                    <p className="text-sm text-text-muted">Time</p>
                    <p className="mt-1 font-medium text-text">{time}</p>
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

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1" onClick={() => navigate(`/${id}/register`)}>
                    Register
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => navigate(`/${id}/signin`)}
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </Layout>
  );
}

export default Event;
