import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout, Card, Button, FormField } from './components';
import { apiUrl } from './api/client';

function RegistrationSys() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [eventName, setEventName] = useState('');
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      try {
        const response = await fetch(apiUrl(`/${id}`));
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setEventName(data[0].name);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadEvent();
  }, [id]);

  async function submitForm(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);
    setSuccess('');

    try {
      const response = await fetch(apiUrl(`/${id}/register`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await response.json();

      if ('errors' in data) {
        setErrors(data.errors.map((err) => err.msg));
      } else if ('success' in data) {
        setSuccess('Registration successful! Check your email for a QR code.');
        setName('');
        setEmail('');
      } else if (data.detail) {
        setErrors([data.detail]);
      } else {
        setErrors(['Registration failed. Please try again.']);
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
      <div className="flex w-full flex-col gap-4">
        <Button variant="ghost" onClick={() => navigate(`/${id}`)} className="self-start">
          ← Back to event
        </Button>

        <Card>
          <Card.Header>
            <h1 className="text-xl font-semibold text-text">Register</h1>
            {eventName && (
              <p className="text-sm text-text-muted">{eventName}</p>
            )}
          </Card.Header>

          <Card.Body>
            <p className="mb-5 text-sm text-text-muted">
              Fill out the form below. You&apos;ll receive a QR code by email to check in at the event.
            </p>

            <form onSubmit={submitForm} className="flex flex-col gap-4">
              <FormField
                id="reg-name"
                label="Name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <FormField
                id="reg-email"
                label="Email"
                type="email"
                placeholder="johndoe@gmail.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

              {success && (
                <div className="rounded-lg border border-success/20 bg-success-soft px-3 py-2">
                  <p className="text-sm text-success">{success}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting || !name || !email}
              >
                {submitting ? 'Registering...' : 'Register'}
              </Button>
            </form>
          </Card.Body>
        </Card>
      </div>
    </Layout>
  );
}

export default RegistrationSys;
