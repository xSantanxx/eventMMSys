import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Layout, Card, Button } from './components';
import { apiFetch, getToken } from './api/client';

/** Organizer-only QR check-in scanner. */
function Sign() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const scanningRef = useRef(false);

  useEffect(() => {
    if (!getToken()) {
      navigate('/org', {
        replace: true,
        state: { from: `/org/events/${id}/check-in` },
      });
    }
  }, [id, navigate]);

  async function checkIn(result) {
    if (!result?.[0]?.rawValue || scanningRef.current) return;
    if (!getToken()) {
      setStatusType('error');
      setStatus('Please log in again to check attendees in.');
      navigate('/org');
      return;
    }

    scanningRef.current = true;
    try {
      const response = await apiFetch(`/${id}/signin`, {
        method: 'POST',
        body: JSON.stringify({ user: result[0].rawValue }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setStatusType('error');
        setStatus('Please log in again to check attendees in.');
        navigate('/org');
        return;
      }

      if (response.ok) {
        setStatusType('success');
        setStatus(data.message || "You're checked in");
      } else {
        setStatusType('error');
        setStatus(data.error || 'Check-in failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setStatusType('error');
      setStatus('Something went wrong. Please try again.');
    } finally {
      setTimeout(() => {
        scanningRef.current = false;
      }, 1500);
    }
  }

  return (
    <Layout>
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate(`/org/events/${id}`)}
            className="self-start"
          >
            ← Back to event
          </Button>
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-primary">
            Organizer
          </span>
        </div>

        <Card>
          <Card.Header>
            <h1 className="text-xl font-semibold text-text">Check-in scanner</h1>
            <p className="text-sm text-text-muted">Scan attendee QR codes</p>
          </Card.Header>

          <Card.Body>
            <p className="mb-4 text-sm text-text-muted">
              Point your camera at the QR code from the attendee&apos;s
              confirmation email.
            </p>

            <div className="overflow-hidden rounded-xl border border-border">
              <Scanner onScan={checkIn} />
            </div>

            {status && (
              <div
                className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                  statusType === 'success'
                    ? 'border border-success/20 bg-success-soft text-success'
                    : 'border border-error/20 bg-error-soft text-error'
                }`}
              >
                {status}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </Layout>
  );
}

export default Sign;
