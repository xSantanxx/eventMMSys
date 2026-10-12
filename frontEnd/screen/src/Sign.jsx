import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Layout, Card, Button } from './components';
import { apiFetch, apiUrl, getToken } from './api/client';
import { playErrorSound, playSuccessSound } from './kioskSounds';

const COOLDOWN_MS = 2500;
const POLL_MS = 3000;

/** Organizer QR check-in with optional fullscreen kiosk mode. */
function Sign() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [attendeeName, setAttendeeName] = useState('');
  const [kiosk, setKiosk] = useState(false);
  const [registered, setRegistered] = useState(0);
  const [checkedIn, setCheckedIn] = useState(0);
  const [capacity, setCapacity] = useState(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const scanningRef = useRef(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!getToken()) {
      navigate('/org', {
        replace: true,
        state: { from: `/org/events/${id}/check-in` },
      });
    }
  }, [id, navigate]);

  async function refreshCounts() {
    try {
      const response = await fetch(apiUrl(`/${id}`));
      const data = await response.json();
      if (Array.isArray(data) && data[0]) {
        setRegistered(data[0].registered ?? 0);
        setCheckedIn(data[0].checked_in ?? 0);
        setCapacity(data[0].capacity ?? null);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    refreshCounts();
    const timer = setInterval(refreshCounts, POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (cooldownLeft <= 0) return undefined;
    const timer = setTimeout(() => setCooldownLeft((v) => Math.max(0, v - 100)), 100);
    return () => clearTimeout(timer);
  }, [cooldownLeft]);

  useEffect(() => {
    function onFullscreenChange() {
      const active = Boolean(document.fullscreenElement);
      setKiosk(active);
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  async function toggleKiosk() {
    try {
      if (!document.fullscreenElement) {
        await (rootRef.current || document.documentElement).requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error(err);
      setStatusType('error');
      setStatus('Fullscreen was blocked by the browser.');
      playErrorSound();
    }
  }

  async function checkIn(result) {
    if (!result?.[0]?.rawValue || scanningRef.current || cooldownLeft > 0) return;
    if (!getToken()) {
      setStatusType('error');
      setStatus('Please log in again to check attendees in.');
      navigate('/org');
      return;
    }

    scanningRef.current = true;
    setCooldownLeft(COOLDOWN_MS);
    try {
      const response = await apiFetch(`/${id}/signin`, {
        method: 'POST',
        body: JSON.stringify({ user: result[0].rawValue }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setStatusType('error');
        setStatus('Please log in again to check attendees in.');
        playErrorSound();
        navigate('/org');
        return;
      }

      if (response.ok) {
        setStatusType('success');
        setStatus(data.message || "You're checked in");
        setAttendeeName(data.attendee?.name || '');
        if (typeof data.registered === 'number') setRegistered(data.registered);
        if (typeof data.checked_in === 'number') setCheckedIn(data.checked_in);
        if (data.capacity !== undefined) setCapacity(data.capacity);
        playSuccessSound();
      } else {
        setStatusType('error');
        setStatus(data.error || 'Check-in failed. Please try again.');
        setAttendeeName(data.attendee?.name || '');
        playErrorSound();
      }
    } catch (err) {
      console.error(err);
      setStatusType('error');
      setStatus('Something went wrong. Please try again.');
      setAttendeeName('');
      playErrorSound();
    } finally {
      setTimeout(() => {
        scanningRef.current = false;
      }, COOLDOWN_MS);
    }
  }

  const capacityLabel =
    capacity == null ? 'Unlimited' : `${registered} / ${capacity}`;

  return (
    <div ref={rootRef} className={kiosk ? 'min-h-screen bg-background' : ''}>
      <Layout className={kiosk ? 'max-w-4xl' : ''}>
        <div className={`flex w-full flex-col gap-4 ${kiosk ? 'scale-[1.02]' : ''}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate(`/org/events/${id}`)}
              className="self-start"
            >
              ← Back to event
            </Button>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-primary">
                Organizer
              </span>
              <Button variant="secondary" onClick={toggleKiosk}>
                {kiosk ? 'Exit kiosk' : 'Kiosk mode'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-surface p-3 text-center">
              <p className="text-xs text-text-muted">Registered</p>
              <p className="text-2xl font-semibold text-text">{registered}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 text-center">
              <p className="text-xs text-text-muted">Checked in</p>
              <p className="text-2xl font-semibold text-text">{checkedIn}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 text-center">
              <p className="text-xs text-text-muted">Capacity</p>
              <p className="text-lg font-semibold text-text">{capacityLabel}</p>
            </div>
          </div>

          <Card>
            <Card.Header>
              <h1 className="text-xl font-semibold text-text">
                {kiosk ? 'Kiosk check-in' : 'Check-in scanner'}
              </h1>
              <p className="text-sm text-text-muted">
                Scan attendee QR codes
                {cooldownLeft > 0
                  ? ` · cooldown ${(cooldownLeft / 1000).toFixed(1)}s`
                  : ''}
              </p>
            </Card.Header>

            <Card.Body>
              <p className="mb-4 text-sm text-text-muted">
                Point the camera at the QR code from the attendee&apos;s confirmation
                email. Sounds play on success/failure in kiosk use.
              </p>

              <div
                className={`overflow-hidden rounded-xl border border-border ${
                  cooldownLeft > 0 ? 'opacity-70' : ''
                }`}
              >
                <Scanner onScan={checkIn} />
              </div>

              {status && (
                <div
                  className={`mt-4 rounded-lg px-4 py-3 text-base font-medium ${
                    statusType === 'success'
                      ? 'border border-success/20 bg-success-soft text-success'
                      : 'border border-error/20 bg-error-soft text-error'
                  }`}
                >
                  <p>{status}</p>
                  {attendeeName && (
                    <p className="mt-1 text-sm opacity-90">{attendeeName}</p>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </Layout>
    </div>
  );
}

export default Sign;
