const {check, validationResult} = require('express-validator')
const express = require('express');
const cors = require('cors');
const path = require('path');
const url = require('url');
const qrcode = require('qrcode');
const qr = require('qr-image');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const db = require('./db')
const app = express();

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set('views', path.join(__dirname));
app.set('view engine', 'ejs')

const PORT = process.env.PORT;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: `${process.env.userEm}`,
        pass: `${process.env.userPass}`
    }
});

app.post('/addEvent', [
    check('name', 'Name length should be 12 to 40 characters')
        .isLength({min: 12, max:40}),
    check('date', 'Date must be valid')
        .isDate(),
    check('description', 'Description length must be greater 10')
        .isLength({min: 10}),
    check('created_at', 'Date must be valid')
        .isISO8601().toDate(),
    
], async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        res.status(400).send(errors);
    } else {
        try{

            const token = crypto.randomBytes(16).toString('hex');

            const query = 'INSERT INTO events (id ,name, date, description, created_at) VALUES ($1, $2, $3, $4, $5)'
            const values = [token,req.body.name, req.body.date, req.body.description, req.body.created_at];

            const server = await db.query(query, values);
            
            res.status(201).send({message: 'Your event has been added'});

        } catch(e) {
            res.status(400).send(e);
            console.log(e);
        }
        
    }
});

app.get('/getEvents', async (req, res) => {
    try{
        const server = await db.query(`SELECT * FROM events`)
        res.status(200).send(server.rows);
    } catch(e) {
        res.json({'error': e})
    }
    
});

app.post('/:id/signin', async(req, res) => {
    try{

        const id = req.params['id'];
        const qr = req.body.user;

        const authserver = await db.query(`SELECT * FROM attendees WHERE qr_token = '${qr}'`)

        if(authserver.rows[0].checked_in === true){
            res.status(404).send(`You're already checked in`)
        } else {
            const server = await db.query(`UPDATE attendees SET checked_in = true WHERE qr_token = '${qr}'`)

            const q = `UPDATE events SET checked_in = checked_in + 1 WHERE id = $1`
            const v = [id];

            const incServer = await db.query(q,v);

            res.status(200).send(`You're checked in`)
        } 
    } catch (err) {
        res.status(404).send(err)
    }
})

app.get('/:id', async (req, res) => {
    try{
        const id = req.params['id'];
        const server = await db.query(`SELECT * FROM events WHERE id = '${id}'`)
        res.status(200).send(server.rows)
    } catch(e) {
        res.status(404).send(`This event doesn't exist`);
    }
})

app.post('/:id/register',[
    check('name','Name length should be 10 to 30 characters')
        .isLength({min: 10, max: 30}),
    check('email', 'Email length should be 20 to 50 characters')
        .isLength({min: 20, max: 50}),
], async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        res.status(400).send(errors);
    } else {
        try{
        const id = req.params['id'];

        const q = `SELECT EXISTS(SELECT 1 FROM events WHERE id = $1)`
        const v = [id];

        const checkServer = await db.query(q,v);
        if(checkServer.rows[0].exists === true){
            const token = crypto.randomBytes(16).toString('hex');
            const attendeesId = crypto.randomBytes(16).toString('hex');

            const query = 'INSERT INTO attendees (id,name, email, event_id, qr_token, checked_in) VALUES ($1, $2, $3, $4, $5, $6)'
            const values = [attendeesId,req.body.name, req.body.email, id, token, false]

            const server = await db.query(query, values);

            const sendEmail = process.env.userEm;

            const dataToSend  = await qrcode.toBuffer(token);

            const serverName = await db.query(`SELECT * FROM events WHERE id = '${id}'`)
            const nameOfEvent = serverName.rows[0].name;

            const mailOptions = {
                    from: `${sendEmail}`,
                    to: `${values[2]}`,
                    subject: `Confirmation Email + ${nameOfEvent}`,
                    html: `<p>Here's your QR Code to be scanned in </p>
                    <img src="cid:codeID" alt="code">`,
                    attachments: [{
                        filename: 'codeID.png',
                        content: dataToSend,
                        cid: 'codeID'
                    }]
                };

                transporter.sendMail(mailOptions, function(err,info){
                    if(err){
                        console.log(err);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                })

                const q = `UPDATE events SET registered = registered + 1 WHERE id = $1`
                const v = [id];

                const incServer = await db.query(q,v);
            res.status(201).send({success :'Created'});

        } else {
            res.status(400).send('Not Found');
        }

    } catch(e) {
        res.status(400).send(e);
    }
    }
})



//server connection
app.listen(PORT, (e) => {
    if(!e){
        console.log(`Server is running on ${PORT}`)
    } else {
        console.log("Server didn't start");
    }
});