import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout, Card, Button, FormField } from './components';
import { apiUrl } from './api/client';
import {
  downloadPngDataUrl,
  isPngDataUrl,
  qrDownloadFilename,
  registrationSuccessMessage,
} from './registrationSuccess';

/** Public attendee registration (no login). */
function RegistrationSys() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [eventName, setEventName] = useState('');
  const [gateMessage, setGateMessage] = useState('');
  const [canRegister, setCanRegister] = useState(true);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');
  const [downloadMessage, setDownloadMessage] = useState('');
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    async function loadEvent() {
      try {
        const response = await fetch(apiUrl(`/${id}`));
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const event = data[0];
          setEventName(event.name);
          const status = event.status || 'live';
          const capacity = event.capacity;
          const registered = event.registered ?? 0;
          if (status === 'draft') {
            setCanRegister(false);
            setGateMessage('Registration is not open yet.');
          } else if (status === 'closed') {
            setCanRegister(false);
            setGateMessage('Registration is closed.');
          } else if (capacity != null && registered >= capacity) {
            setCanRegister(false);
            setGateMessage('This event is full.');
          } else {
            setCanRegister(true);
            setGateMessage('');
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadEvent();
  }, [id]);

  async function submitForm(e) {
    e.preventDefault();
    if (!canRegister) return;
    setSubmitting(true);
    setErrors([]);
    setResendMessage('');
    setResendError('');

    try {
      const response = await fetch(apiUrl(`/${id}/register`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await response.json();

      if ('errors' in data) {
        setErrors(data.errors.map((err) => err.msg));
      } else if ('success' in data && isPngDataUrl(data.qrDataUrl)) {
        setDone({
          email,
          emailSent: data.emailSent !== false,
          qrDataUrl: data.qrDataUrl,
        });
        setName('');
        setEmail('');
      } else if ('success' in data) {
        setErrors([
          'Registered, but the QR code could not be displayed. Contact the organizer.',
        ]);
      } else {
        setErrors([data.error || 'Registration failed. Please try again.']);
        if (
          data.error === 'Registration is closed' ||
          data.error === 'Registration is not open yet' ||
          data.error === 'Event is full'
        ) {
          setCanRegister(false);
          setGateMessage(data.error);
        }
      }
    } catch (err) {
      console.error(err);
      setErrors(['Something went wrong. Please try again.']);
    } finally {
      setSubmitting(false);
    }
  }

  function downloadQr() {
    if (!done?.qrDataUrl) return;
    setDownloadMessage('');
    setDownloadError('');
    try {
      downloadPngDataUrl(done.qrDataUrl, qrDownloadFilename(eventName));
      setDownloadMessage('QR downloaded. Keep this file for check-in.');
      setTimeout(() => setDownloadMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setDownloadError('Download failed. Long-press / right-click the QR to save it.');
    }
  }

  async function resendEmail() {
    if (!done?.email) return;
    setResending(true);
    setResendMessage('');
    setResendError('');
    try {
      const response = await fetch(apiUrl(`/${id}/register/resend`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: done.email }),
      });
      const data = await response.json();
      if (data.emailSent) {
        setDone((prev) => (prev ? { ...prev, emailSent: true } : prev));
        setResendMessage(data.success || 'Confirmation email sent');
      } else {
        setResendError(
          data.success ||
            data.error ||
            'Confirmation email could not be sent. Download the QR instead.'
        );
      }
    } catch (err) {
      console.error(err);
      setResendError('Failed to resend email. Download the QR instead.');
    } finally {
      setResending(false);
    }
  }

  return (
    <Layout>
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate(`/e/${id}`)}
            className="self-start"
          >
            ← Back to event
          </Button>
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-primary">
            Attendee
          </span>
        </div>

        <Card>
          <Card.Header>
            <h1 className="text-xl font-semibold text-text">
              {done ? 'You are registered' : 'Register'}
            </h1>
            {eventName && (
              <p className="text-sm text-text-muted">{eventName}</p>
            )}
          </Card.Header>

          <Card.Body>
            {done ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-text-muted">
                  {registrationSuccessMessage(done.emailSent)}
                </p>

                <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-background p-4">
                  <img
                    src={done.qrDataUrl}
                    alt="Your check-in QR code"
                    className="h-56 w-56 rounded-md bg-white p-2"
                  />
                  <p className="text-center text-sm text-text-muted">
                    Show this code at check-in
                    {done.email ? (
                      <>
                        {' '}
                        · sent to <span className="text-text">{done.email}</span>
                      </>
                    ) : null}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={downloadQr}
                  >
                    Download QR
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    disabled={resending}
                    onClick={resendEmail}
                  >
                    {resending ? 'Sending...' : 'Resend email (optional)'}
                  </Button>
                </div>

                {downloadMessage && (
                  <p className="text-sm text-success">{downloadMessage}</p>
                )}
                {downloadError && (
                  <p className="text-sm text-error">{downloadError}</p>
                )}
                {resendMessage && (
                  <p className="text-sm text-success">{resendMessage}</p>
                )}
                {resendError && (
                  <p className="text-sm text-error">{resendError}</p>
                )}
              </div>
            ) : (
              <>
                {gateMessage ? (
                  <p className="mb-5 rounded-lg border border-error/20 bg-error-soft px-3 py-2 text-sm text-error">
                    {gateMessage}
                  </p>
                ) : (
                  <p className="mb-5 text-sm text-text-muted">
                    Fill out the form below. You&apos;ll get a QR code on the next
                    screen and by email for check-in.
                  </p>
                )}

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

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting || !canRegister || !name || !email}
                  >
                    {submitting ? 'Registering...' : 'Register'}
                  </Button>
                </form>
              </>
            )}
          </Card.Body>
        </Card>
      </div>
    </Layout>
  );
}

export default RegistrationSys;
