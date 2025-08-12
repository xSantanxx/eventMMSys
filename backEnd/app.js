const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db')
const app = express();

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const PORT = process.env.PORT;

// initial connection
app.get('/', async (req, res) => {
    try{
        const server = await db.query('SELECT * FROM user0');
        res.json(server.rows)
    } catch (e){
        console.log(e);
        res.status(500).send('server error')
    }
});

//server connection
app.listen(PORT, (e) => {
    if(!e){
        console.log(`Server is running on ${PORT}`)
    } else {
        console.log("Server didn't start");
    }
});