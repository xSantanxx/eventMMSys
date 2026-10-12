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
  hashPassword,
  verifyPassword,
} = require('./auth');

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
    check('name', 'Name length should be 2 to 60 characters').isLength({
      min: 2,
      max: 60,
    }),
    check('email', 'Valid email required').isEmail().normalizeEmail(),
    check('password', 'Password must be at least 8 characters').isLength({
      min: 8,
      max: 128,
    }),
  ],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;

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
      console.error(error);
      res.status(500).json({ error: 'Unable to create account' });
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
    check('date', 'Date must be valid').isDate(),
    check('description', 'Description length must be greater 10').isLength({
      min: 10,
    }),
    check('created_at', 'Date must be valid').isISO8601().toDate(),
  ],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;

    try {
      const token = crypto.randomBytes(16).toString('hex');
      const query =
        'INSERT INTO events (id, organizer_id, name, date, description, created_at) VALUES ($1, $2, $3, $4, $5, $6)';
      const values = [
        token,
        req.organizer.id,
        req.body.name,
        req.body.date,
        req.body.description,
        req.body.created_at,
      ];

      await db.query(query, values);
      res.status(201).json({ message: 'Your event has been added', id: token });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: 'Failed to create event' });
    }
  }
);

app.get('/getEvents', requireAuth, async (req, res) => {
  try {
    const server = await db.query(
      'SELECT id, name, date, description, created_at, registered, checked_in FROM events WHERE organizer_id = $1 ORDER BY created_at DESC',
      [req.organizer.id]
    );
    res.status(200).json(server.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch events' });
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

    const checkedIn = await db.query(
      `UPDATE attendees
       SET checked_in = true
       WHERE qr_token = $1 AND event_id = $2 AND checked_in = false
       RETURNING id`,
      [qrToken, id]
    );

    if (checkedIn.rowCount > 0) {
      await db.query(
        'UPDATE events SET checked_in = checked_in + 1 WHERE id = $1',
        [id]
      );
      return res.status(200).json({ message: "You're checked in" });
    }

    const existing = await db.query(
      'SELECT checked_in FROM attendees WHERE qr_token = $1 AND event_id = $2',
      [qrToken, id]
    );

    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Invalid QR code for this event' });
    }

    return res.status(409).json({ error: "You're already checked in" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Check-in failed' });
  }
});

app.get('/:id', async (req, res) => {
  try {
    const server = await db.query(
      'SELECT id, name, date, description, created_at, registered, checked_in FROM events WHERE id = $1',
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
    check('name', 'Name length should be 10 to 30 characters').isLength({
      min: 10,
      max: 30,
    }),
    check('email', 'Valid email required').isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    if (sendValidationErrors(req, res)) return;

    try {
      const id = req.params.id;
      const checkServer = await db.query(
        'SELECT EXISTS(SELECT 1 FROM events WHERE id = $1) AS exists',
        [id]
      );

      if (!checkServer.rows[0].exists) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const token = crypto.randomBytes(16).toString('hex');
      const attendeesId = crypto.randomBytes(16).toString('hex');
      const query =
        'INSERT INTO attendees (id, name, email, event_id, qr_token, checked_in) VALUES ($1, $2, $3, $4, $5, $6)';
      const values = [attendeesId, req.body.name, req.body.email, id, token, false];

      await db.query(query, values);

      const dataToSend = await qrcode.toBuffer(token);
      const serverName = await db.query('SELECT name FROM events WHERE id = $1', [id]);
      const nameOfEvent = serverName.rows[0].name;

      let emailSent = false;
      try {
        await sendRegistrationEmail({
          to: values[2],
          eventName: nameOfEvent,
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
      console.error(error);
      res.status(400).json({ error: 'Registration failed' });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
