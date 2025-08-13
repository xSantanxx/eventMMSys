const {check, validationResult} = require('express-validator')
const express = require('express');
const cors = require('cors');
const path = require('path');
const url = require('url');
const qrcode = require('qrcode');
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
    check('description', 'Description length must be greater 20')
        .isLength({min: 20}),
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
            
            res.status(201).send(server.rows);

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
    check('name','Name length should be 12 to 30 characters')
        .isLength({min: 12, max: 30}),
    check('email', 'Email length should be 20 to 50 characters')
        .isLength({min: 20, max: 50}),
], async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        res.status(400).send('Bad Request');
    }
    try{
        const checkServer = await db.query(`SELECT EXISTS(SELECT 1 FROM events WHERE id=${req.body.id})`)
        if(checkServer){
            const token = crypto.randomBytes(50).toString('hex');

            const server = await db.query(`INSERT INTO attendees (name, email, event_id, qr_token)
                VALUES('${req.body.name}', '${req.body.email}', '${req.body.id}', '${token}')`);

            res.status(201).send('Created');

            qrcode.toDataURL(token, function(err, url){

                const mailOptions = {
                    from: `${process.env.userEm}`,
                    to: `${req.body.email}`,
                    subject: `Confirmation Email`,
                    text: `Here's your QR Code to be scanned in${url}`
                };

                transporter.sendMail(mailOptions, function(err,info){
                    if(err){
                        console.log(err);
                    }
                })
            })
        } else {
            res.status(400).send('Not Found');
        }

    } catch(e) {

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