import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Layout, Card, Button } from './components';

function Sign() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');

  async function checkIn(result) {
    if (!result?.[0]?.rawValue) return;

    try {
      const response = await fetch(`http://localhost:${import.meta.env.VITE_PORT}/${id}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: result[0].rawValue }),
      });
      const data = await response.text();

      if (response.ok) {
        setStatusType('success');
        setStatus(data);
      } else {
        setStatusType('error');
        setStatus(data || 'Check-in failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setStatusType('error');
      setStatus('Something went wrong. Please try again.');
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
            <h1 className="text-xl font-semibold text-text">Sign In</h1>
            <p className="text-sm text-text-muted">Scan your QR code to check in</p>
          </Card.Header>

          <Card.Body>
            <p className="mb-4 text-sm text-text-muted">
              Point your camera at the QR code from your confirmation email.
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
