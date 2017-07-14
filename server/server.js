const express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var compression = require('compression');
var train = require('./routes/train');
var run = require('./routes/run');

const port = process.env.port || 3000;
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression()); //Compress all routes

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/train',train);
app.use('/run',run);

app.listen(port,function() {
    console.log(`Server listening on ${port}.`);
})