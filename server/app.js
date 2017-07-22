const express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var compression = require('compression');
var socket_io    = require( "socket.io" );

var app = express();
var io = socket_io();
app.io = io;    // Attatch io object to the app to use it in the route

var train = require('./routes/train');
var run = require('./routes/run')(app.io);


// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, '/../public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression()); //Compress all routes
app.use(express.static('public'))

app.use('/train',train);
// app.use(run);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;