const { check, validationResult } = require('express-validator');
const express = require('express');
const cors = require('cors');
const path = require('path');
const qrcode = require('qrcode');
const crypto = require('crypto');
const db = require('./db');
const { sendRegistrationEmail, verifyEmailConfig } = require('./mail');

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
  '/addEvent',
  [
    check('name', 'Name length should be 12 to 40 characters').isLength({ min: 12, max: 40 }),
    check('date', 'Date must be valid').isDate(),
    check('description', 'Description length must be greater 10').isLength({ min: 10 }),
    check('created_at', 'Date must be valid').isISO8601().toDate(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(errors);
    }

    try {
      const token = crypto.randomBytes(16).toString('hex');
      const query =
        'INSERT INTO events (id, name, date, description, created_at) VALUES ($1, $2, $3, $4, $5)';
      const values = [
        token,
        req.body.name,
        req.body.date,
        req.body.description,
        req.body.created_at,
      ];

      await db.query(query, values);
      res.status(201).send({ message: 'Your event has been added' });
    } catch (error) {
      console.error(error);
      res.status(400).send({ error: 'Failed to create event' });
    }
  }
);

app.get('/getEvents', async (req, res) => {
  try {
    const server = await db.query('SELECT * FROM events');
    res.status(200).send(server.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.post('/:id/signin', async (req, res) => {
  try {
    const id = req.params.id;
    const qrToken = req.body.user;

    const authServer = await db.query('SELECT * FROM attendees WHERE qr_token = $1', [qrToken]);

    if (!authServer.rows.length) {
      return res.status(404).send('Invalid QR code');
    }

    if (authServer.rows[0].checked_in === true) {
      return res.status(404).send("You're already checked in");
    }

    await db.query('UPDATE attendees SET checked_in = true WHERE qr_token = $1', [qrToken]);
    await db.query('UPDATE events SET checked_in = checked_in + 1 WHERE id = $1', [id]);

    res.status(200).send("You're checked in");
  } catch (error) {
    console.error(error);
    res.status(404).send('Check-in failed');
  }
});

app.get('/:id', async (req, res) => {
  try {
    const server = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!server.rows.length) {
      return res.status(404).send("This event doesn't exist");
    }
    res.status(200).send(server.rows);
  } catch (error) {
    console.error(error);
    res.status(404).send("This event doesn't exist");
  }
});

app.post(
  '/:id/register',
  [
    check('name', 'Name length should be 10 to 30 characters').isLength({ min: 10, max: 30 }),
    check('email', 'Email length should be 20 to 50 characters').isLength({ min: 20, max: 50 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(errors);
    }

    try {
      const id = req.params.id;
      const checkServer = await db.query('SELECT EXISTS(SELECT 1 FROM events WHERE id = $1)', [id]);

      if (!checkServer.rows[0].exists) {
        return res.status(400).send('Not Found');
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
      res.status(201).send({
        success: emailSent
          ? 'Created'
          : 'Registered, but the confirmation email could not be sent. Contact the event organizer.',
        emailSent,
      });
    } catch (error) {
      console.error(error);
      res.status(400).send({ error: 'Registration failed' });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
