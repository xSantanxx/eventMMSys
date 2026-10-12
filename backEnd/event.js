require('dotenv').config();
const { check, validationResult } = require('express-validator');
const express = require('express');
const cors = require('cors');
const path = require('path');
const qrcode = require('qrcode');
const crypto = require('crypto');
const db = require('./db');
const { sendRegistrationEmail, verifyEmailConfig } = require('./mail');
const {
  signToken,
  requireAuth,
  requireJwtSecret,
  hashPassword,
  verifyPassword,
} = require('./auth');
const {
  createSignedQrToken,
  verifySignedQrToken,
  isLegacyOpaqueToken,
} = require('./qrToken');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app');

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn('Blocked CORS request from:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname));
app.set('view engine', 'ejs');

const EVENT_PUBLIC_COLUMNS =
  'id, name, date, starts_at, ends_at, timezone, description, created_at, registered, checked_in, capacity, status';

function sendValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
}

async function assertEventOwner(eventId, organizerId) {
  const result = await db.query(
    'SELECT id FROM events WHERE id = $1 AND organizer_id = $2',
    [eventId, organizerId]
  );
  return result.rows[0] || null;
}

function dateFromIso(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

function parseCapacity(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    const err = new Error('Capacity must be a positive integer or empty');
    err.status = 400;
    throw err;
  }
  return n;
}

async function writeCheckInLog({ eventId, attendeeId, organizerId, action }) {
  const id = crypto.randomBytes(16).toString('hex');
  await db.query(
    `INSERT INTO check_in_logs (id, event_id, attendee_id, organizer_id, action)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, eventId, attendeeId, organizerId, action]
  );
}

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    const emailStatus = await verifyEmailConfig();
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      email: emailStatus.ok ? 'ready' : 'misconfigured',
      emailMessage: emailStatus.ok ? undefined : emailStatus.message,
    });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: error.message,
    });
  }
});

app.post(
  '/auth/register',
  [
    check('name', 'Name must be at least 1 character')
      .trim()
      .isLength({ min: 1 }),
    check('email', 'Valid email required').isEmail().normalizeEmail(),
    check('password', 'Password must be at least 8 characters').isLength({
      min: 8,
      max: 128,
    }),
  ],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;

    try {
      requireJwtSecret();
    } catch (error) {
      if (error.code === 'JWT_SECRET_MISSING') {
        console.error(error.message);
        return res.status(500).json({
          error:
            'Server misconfigured: set JWT_SECRET in backEnd/.env (or host env vars) and restart.',
        });
      }
      throw error;
    }

    try {
      const id = crypto.randomBytes(16).toString('hex');
      const passwordHash = await hashPassword(req.body.password);
      const result = await db.query(
        'INSERT INTO organizers (id, name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
        [id, req.body.name, req.body.email, passwordHash]
      );
      const organizer = result.rows[0];
      res.status(201).json({
        message: 'Organizer account created',
        token: signToken(organizer),
        organizer,
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email already registered' });
      }
      if (error.code === '42P01') {
        console.error(error);
        return res.status(500).json({
          error:
            'Database missing organizers table. Run backEnd/schema_supabase.sql in Supabase SQL Editor.',
        });
      }
      console.error('Register failed:', error.code || error.name, error.message);
      res.status(500).json({
        error: 'Unable to create account',
        detail: process.env.NODE_ENV === 'production' ? undefined : error.message,
      });
    }
  }
);

app.post(
  '/auth/login',
  [
    check('email', 'Valid email required').isEmail().normalizeEmail(),
    check('password', 'Password is required').isLength({ min: 1 }),
  ],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;

    try {
      const result = await db.query(
        'SELECT id, name, email, password_hash FROM organizers WHERE email = $1',
        [req.body.email]
      );
      const organizer = result.rows[0];
      if (!organizer) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const ok = await verifyPassword(req.body.password, organizer.password_hash);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const publicOrganizer = {
        id: organizer.id,
        name: organizer.name,
        email: organizer.email,
      };
      res.status(200).json({
        message: 'Logged in',
        token: signToken(publicOrganizer),
        organizer: publicOrganizer,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Unable to log in' });
    }
  }
);

app.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email FROM organizers WHERE id = $1',
      [req.organizer.id]
    );
    if (!result.rows[0]) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    res.status(200).json({ organizer: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load profile' });
  }
});

app.post(
  '/addEvent',
  requireAuth,
  [
    check('name', 'Name length should be 12 to 40 characters').isLength({
      min: 12,
      max: 40,
    }),
    check('description', 'Description length must be greater 10').isLength({
      min: 10,
    }),
    check('starts_at', 'Start time must be a valid ISO date').isISO8601(),
    check('ends_at', 'End time must be a valid ISO date').isISO8601(),
    check('timezone', 'Timezone is required')
      .optional({ values: 'falsy' })
      .isLength({ min: 1, max: 64 }),
    check('ends_at').custom((endsAt, { req }) => {
      if (new Date(endsAt) <= new Date(req.body.starts_at)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
    check('status')
      .optional()
      .isIn(['draft', 'live', 'closed'])
      .withMessage('Status must be draft, live, or closed'),
    check('created_at', 'Date must be valid').isISO8601().toDate(),
  ],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;

    try {
      const token = crypto.randomBytes(16).toString('hex');
      const startsAt = new Date(req.body.starts_at).toISOString();
      const endsAt = new Date(req.body.ends_at).toISOString();
      const eventDate = dateFromIso(startsAt);
      const timezone = req.body.timezone || 'UTC';
      const capacity = parseCapacity(req.body.capacity);
      const status = req.body.status || 'live';

      const query = `INSERT INTO events
        (id, organizer_id, name, date, starts_at, ends_at, timezone, description, created_at, capacity, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;
      const values = [
        token,
        req.organizer.id,
        req.body.name,
        eventDate,
        startsAt,
        endsAt,
        timezone,
        req.body.description,
        req.body.created_at,
        capacity,
        status,
      ];

      await db.query(query, values);
      res.status(201).json({ message: 'Your event has been added', id: token });
    } catch (error) {
      console.error(error);
      if (error.status === 400) {
        return res.status(400).json({ error: error.message });
      }
      if (error.code === '42703') {
        return res.status(500).json({
          error:
            'Database missing P1/P2 columns. Run schema_p1.sql and schema_p2.sql in Supabase.',
        });
      }
      res.status(400).json({ error: 'Failed to create event' });
    }
  }
);

app.get('/getEvents', requireAuth, async (req, res) => {
  try {
    const server = await db.query(
      `SELECT ${EVENT_PUBLIC_COLUMNS} FROM events WHERE organizer_id = $1 ORDER BY COALESCE(starts_at, created_at) DESC`,
      [req.organizer.id]
    );
    res.status(200).json(server.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.patch(
  '/:id',
  requireAuth,
  [
    check('status')
      .optional()
      .isIn(['draft', 'live', 'closed'])
      .withMessage('Status must be draft, live, or closed'),
  ],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;

    try {
      const id = req.params.id;
      const owned = await assertEventOwner(id, req.organizer.id);
      if (!owned) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const updates = [];
      const values = [];
      let i = 1;

      if (Object.prototype.hasOwnProperty.call(req.body, 'capacity')) {
        updates.push(`capacity = $${i++}`);
        values.push(parseCapacity(req.body.capacity));
      }
      if (req.body.status) {
        updates.push(`status = $${i++}`);
        values.push(req.body.status);
      }

      if (!updates.length) {
        return res.status(400).json({ error: 'No updates provided' });
      }

      values.push(id);
      const result = await db.query(
        `UPDATE events SET ${updates.join(', ')} WHERE id = $${i}
         RETURNING ${EVENT_PUBLIC_COLUMNS}`,
        values
      );
      res.status(200).json({ event: result.rows[0] });
    } catch (error) {
      console.error(error);
      if (error.status === 400) {
        return res.status(400).json({ error: error.message });
      }
      if (error.code === '42703') {
        return res.status(500).json({
          error: 'Database missing capacity/status. Run schema_p2.sql in Supabase.',
        });
      }
      res.status(500).json({ error: 'Failed to update event' });
    }
  }
);

app.get('/:id/attendees', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const owned = await assertEventOwner(id, req.organizer.id);
    if (!owned) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    let result;
    if (q) {
      const like = `%${q}%`;
      result = await db.query(
        `SELECT id, name, email, checked_in
         FROM attendees
         WHERE event_id = $1 AND (name ILIKE $2 OR email ILIKE $2)
         ORDER BY name ASC`,
        [id, like]
      );
    } else {
      result = await db.query(
        `SELECT id, name, email, checked_in
         FROM attendees
         WHERE event_id = $1
         ORDER BY name ASC`,
        [id]
      );
    }

    res.status(200).json({ attendees: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load attendees' });
  }
});

app.get('/:id/check-in-log', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const owned = await assertEventOwner(id, req.organizer.id);
    if (!owned) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const result = await db.query(
      `SELECT l.id, l.action, l.created_at, l.attendee_id,
              a.name AS attendee_name, a.email AS attendee_email,
              o.name AS organizer_name
       FROM check_in_logs l
       JOIN attendees a ON a.id = l.attendee_id
       LEFT JOIN organizers o ON o.id = l.organizer_id
       WHERE l.event_id = $1
       ORDER BY l.created_at DESC
       LIMIT 50`,
      [id]
    );
    res.status(200).json({ logs: result.rows });
  } catch (error) {
    console.error(error);
    if (error.code === '42P01') {
      return res.status(500).json({
        error: 'Database missing check_in_logs. Run schema_p2.sql in Supabase.',
      });
    }
    res.status(500).json({ error: 'Failed to load check-in log' });
  }
});

app.post('/:id/attendees/:attendeeId/undo-checkin', requireAuth, async (req, res) => {
  try {
    const { id, attendeeId } = req.params;
    const owned = await assertEventOwner(id, req.organizer.id);
    if (!owned) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const undone = await db.query(
      `UPDATE attendees
       SET checked_in = false
       WHERE id = $1 AND event_id = $2 AND checked_in = true
       RETURNING id, name, email`,
      [attendeeId, id]
    );

    if (!undone.rowCount) {
      return res.status(409).json({ error: 'Attendee is not checked in' });
    }

    await db.query(
      'UPDATE events SET checked_in = GREATEST(checked_in - 1, 0) WHERE id = $1',
      [id]
    );

    try {
      await writeCheckInLog({
        eventId: id,
        attendeeId,
        organizerId: req.organizer.id,
        action: 'undo',
      });
    } catch (logError) {
      console.error('Failed to write undo log:', logError.message);
    }

    const counts = await db.query(
      'SELECT registered, checked_in FROM events WHERE id = $1',
      [id]
    );

    res.status(200).json({
      message: 'Check-in undone',
      attendee: undone.rows[0],
      registered: counts.rows[0].registered,
      checked_in: counts.rows[0].checked_in,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to undo check-in' });
  }
});

app.post('/:id/signin', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const qrToken = req.body.user;

    if (!qrToken || typeof qrToken !== 'string') {
      return res.status(400).json({ error: 'QR token is required' });
    }

    const owned = await assertEventOwner(id, req.organizer.id);
    if (!owned) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const signed = verifySignedQrToken(qrToken);
    if (signed) {
      if (signed.eventId !== id) {
        return res.status(404).json({ error: 'Invalid QR code for this event' });
      }
    } else if (!isLegacyOpaqueToken(qrToken) && !qrToken.startsWith('v1.')) {
      return res.status(404).json({ error: 'Invalid QR code for this event' });
    } else if (qrToken.startsWith('v1.') && !signed) {
      return res.status(404).json({ error: 'Invalid or tampered QR code' });
    }

    const checkedIn = await db.query(
      `UPDATE attendees
       SET checked_in = true
       WHERE qr_token = $1 AND event_id = $2 AND checked_in = false
       RETURNING id, name, email`,
      [qrToken, id]
    );

    if (checkedIn.rowCount > 0) {
      await db.query(
        'UPDATE events SET checked_in = checked_in + 1 WHERE id = $1',
        [id]
      );

      try {
        await writeCheckInLog({
          eventId: id,
          attendeeId: checkedIn.rows[0].id,
          organizerId: req.organizer.id,
          action: 'check_in',
        });
      } catch (logError) {
        console.error('Failed to write check-in log:', logError.message);
      }

      const counts = await db.query(
        'SELECT registered, checked_in, capacity, status FROM events WHERE id = $1',
        [id]
      );

      return res.status(200).json({
        message: "You're checked in",
        attendee: checkedIn.rows[0],
        registered: counts.rows[0].registered,
        checked_in: counts.rows[0].checked_in,
        capacity: counts.rows[0].capacity,
        status: counts.rows[0].status,
      });
    }

    const existing = await db.query(
      'SELECT id, name, checked_in FROM attendees WHERE qr_token = $1 AND event_id = $2',
      [qrToken, id]
    );

    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Invalid QR code for this event' });
    }

    return res.status(409).json({
      error: "You're already checked in",
      attendee: {
        id: existing.rows[0].id,
        name: existing.rows[0].name,
      },
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'QR_SECRET_MISSING') {
      return res.status(500).json({
        error: 'Server misconfigured: set JWT_SECRET or QR_HMAC_SECRET',
      });
    }
    res.status(500).json({ error: 'Check-in failed' });
  }
});

app.get('/:id', async (req, res) => {
  try {
    const server = await db.query(
      `SELECT ${EVENT_PUBLIC_COLUMNS} FROM events WHERE id = $1`,
      [req.params.id]
    );
    if (!server.rows.length) {
      return res.status(404).json({ error: "This event doesn't exist" });
    }
    res.status(200).json(server.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "This event doesn't exist" });
  }
});

app.post(
  '/:id/register',
  [
    check('name', 'Name must be at least 1 character')
      .trim()
      .isLength({ min: 1 }),
    check('email', 'Valid email required').isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;

    try {
      const id = req.params.id;
      const eventResult = await db.query(
        'SELECT id, name, status, capacity, registered FROM events WHERE id = $1',
        [id]
      );

      if (!eventResult.rows.length) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const event = eventResult.rows[0];
      if (event.status === 'draft') {
        return res.status(403).json({ error: 'Registration is not open yet' });
      }
      if (event.status === 'closed') {
        return res.status(403).json({ error: 'Registration is closed' });
      }
      if (event.capacity != null && event.registered >= event.capacity) {
        return res.status(409).json({ error: 'Event is full' });
      }

      const attendeesId = crypto.randomBytes(16).toString('hex');
      const token = createSignedQrToken({ eventId: id, attendeeId: attendeesId });
      const query =
        'INSERT INTO attendees (id, name, email, event_id, qr_token, checked_in) VALUES ($1, $2, $3, $4, $5, $6)';
      const values = [attendeesId, req.body.name, req.body.email, id, token, false];

      await db.query(query, values);

      const dataToSend = await qrcode.toBuffer(token);

      let emailSent = false;
      try {
        await sendRegistrationEmail({
          to: values[2],
          eventName: event.name,
          qrBuffer: dataToSend,
        });
        emailSent = true;
      } catch (emailError) {
        console.error('Failed to send registration email:', emailError.message);
      }

      await db.query('UPDATE events SET registered = registered + 1 WHERE id = $1', [id]);
      res.status(201).json({
        success: emailSent
          ? 'Created'
          : 'Registered, but the confirmation email could not be sent. Contact the event organizer.',
        emailSent,
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'This email is already registered for the event',
          detail: error.detail,
        });
      }
      if (error.code === 'QR_SECRET_MISSING') {
        return res.status(500).json({
          error: 'Server misconfigured: set JWT_SECRET or QR_HMAC_SECRET',
        });
      }
      if (error.code === '42703') {
        return res.status(500).json({
          error: 'Database missing status/capacity. Run schema_p2.sql in Supabase.',
        });
      }
      console.error(error);
      res.status(400).json({ error: 'Registration failed' });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
