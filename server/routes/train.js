const express = require('express');
let router = express.Router();

router.get('/', function(req, res) {
    var spawn = require('child_process').spawn,
    py    = spawn('python', [String(__dirname)+'/../py/train.py']);

    py.stderr.on('data', (data) => {
        console.log(`train.js -> stderr: ${data}`);
    });

    function exitHandler(data, signal) {
        res.sendStatus(200);
        console.log('train.js -> success code:'+data + ' ' + signal);
    }
    function errorHandler(data) {
        res.sendStatus(418);
        console.log('train.js -> error code:' + data);
    }
    py.addListener('close', exitHandler);
    py.addListener('error', errorHandler);

});

module.exports = router;