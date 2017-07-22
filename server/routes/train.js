const express = require('express');
const path = require('path');
const fs = require('fs');
let router = express.Router();

router.get('/', function(req, res) {
    var spawn = require('child_process').spawn,
    py    = spawn('python', [String(__dirname)+'/../py/train.py']);

    py.stderr.on('data', (data) => {
        console.log(`train.js -> stderr: ${data}`);
    });

    function exitHandler(data, signal) {
        console.log('train.js -> success code:'+data + ' ' + signal);
        if(data!=0) {
            res.sendStatus(500);
        }else {
            res.sendStatus(200);
        }
    }
    function errorHandler(data) {
        res.sendStatus(418);
        console.log('train.js -> error code:' + data);
    }
    py.addListener('close', exitHandler);
    py.addListener('error', errorHandler);

});

router.get('/clear', function(req,res) {
    var files = [
        path.join(__dirname,'./../../data/known_encodings_file.csv'),
        path.join(__dirname,'./../../data/people_file.csv')
    ];
    if(fs.existsSync(files[0])) {
        files.forEach(file => {
            fs.unlink(file, function(err) {
                if(err) {
                    console.log(err);
                    res.send(400).send("Error occured,please try again!");
                }else {
                    res.send("Files cleared successfully");
                }
            })
        })
    }else {
        res.status(404).send("No such files");
    }
});

module.exports = router;