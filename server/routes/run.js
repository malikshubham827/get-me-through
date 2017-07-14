const express = require('express');
let router = express.Router();

var pid = -1;

router.get('/', function(req, res) {
    // res.send('running');
    var spawn = require('child_process').spawn,
    py    = spawn('python', [String(__dirname)+'/../py/run.py']);
    
    // Store pid of py to kill if client needs
    pid = py.pid;

    py.stderr.on('data', (data) => {
        console.log(`run.js -> stderr: ${data}`);
    });

    function exitHandler(data, signal) {
        res.sendStatus(200);
        console.log('run.js -> success code:'+data + signal);
    }
    function errorHandler(data) {
        res.sendStatus(418);
        console.log('run.js -> error code:' + data);
    }
    py.addListener('close', exitHandler);
    py.addListener('error', errorHandler);
});

router.get('/stop', function(req, res) {
    if( pid != -1) {
        process.kill(pid);
        pid = -1;
        res.sendStatus(200);
    }else {
        res.send("No Child Process found to kill");
    }
});

module.exports = router;