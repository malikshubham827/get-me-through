module.exports = function (io) {
    var path = require('path')
    const { verify, verifyQR } = require(path.join(__dirname, './../auth/auth'));

    var pid = -1;
    var sendUpdates = false;
    var entryIn = true; // If it is false, then the system is checking leaving people
    // else arriving people

    process.on('unhandledRejection', error => {
        // Will print "unhandledRejection err is not defined"
        console.log('unhandledRejection', error.message);
        console.log(error);
    });

    io.on('connection', function (socket) {
        console.log('a user connected', socket.id);

        function sendLiveUpdates() {
            var spawn = require('child_process').spawn,
                py = spawn('python', [String(__dirname) + '/../py/run.py']);

            // Store pid of py to kill if client needs
            pid = py.pid;

            py.stdout.on('data', function (data1) {
                // pre-processing, as data1 in binary buffer
                data = data1.toString();
                var a = data, arr = [];
                for (var i = 0; i < a.length - 1; i++) {
                    var s = '';
                    // console.log(' cur ' + i);
                    if (a[i] === "'") {
                        i++;
                        // console.log(i);
                        while (i < a.length - 1 && a[i] != "'") {
                            s += a[i];
                            i++;
                        }
                    }
                    if (s != '')
                        arr.push(s);
                }
                if (arr.length == 0) {
                    arr.push('Unknown');
                }
                data = JSON.stringify(arr);
                console.log(" got from py " + data);
                if (sendUpdates) {
                    io.emit('new liveUpdates', data);
                    arr.forEach((name) => {
                        verify(name, entryIn)
                            .then((obj) => {
                                io.emit(obj.eventName, { name, msg: obj.msg, details: obj.details });
                            })
                            .catch((obj) => {
                                io.emit(obj.eventName, { name, msg: obj.msg });
                            })
                            .catch((e) => {
                                console.log('out of the world error');
                                console.log(e);
                            })
                    });
                }

            });
            py.stdout.on('end', function () {
                console.log(' byyee ');
            });
            py.stderr.on('data', (data) => {
                console.log(`stderr: ${data}`);
                io.emit('start error');
            });

            // When python process stops without error
            function exitHandler(data, signal) {
                console.log('run.js -> success code:' + data + ' ' + signal);
                if (data != 0 && data != null) {
                    io.emit('stop error', "Stopping process faced an error, but operation completed.");
                } else {
                    io.emit('stop success');
                }
            }
            /*
            * TODO: check if it collides with socketIO error or not.
            */
            function errorHandler(err) {
                console.log('run.js -> error code:' + err);
                io.emit('stop error', "Internal Server Error. Try again if process not stopped.");
            }
            py.addListener('close', exitHandler);
            py.addListener('error', errorHandler);
        }

        // Receive liveUpdates -> Get update for the first time.
        socket.on('receive liveUpdates', function () {
            sendUpdates = true;
            sendLiveUpdates();
        });

        // halt liveUpdates -> Halt (temporarily) liveUpdates until resumed.
        socket.on('halt liveUpdates', function () {
            sendUpdates = false;
        });

        // Resume liveUpdates -> Resume the process of sendig live Updates halted previously
        socket.on('resume liveUpdates', function () {
            sendUpdates = true;
        });

        // stop liveUpdates -> Stop liveUpdates, Stop/Kill the python process, Stop camera
        socket.on('stop liveUpdates', function () {
            sendUpdates = false;
            if (pid != -1) {
                try {
                    process.kill(pid);
                } catch (e) {
                    console.log(e);
                    io.emit('stop error', "Internal Server Error. Try again.");
                }
                pid = -1;
            } else {
                io.emit('stop error', "No Child Process found to kill");
            }
        });

        socket.on('qr auth', function (opt) {
            // console.log('\ngot msg\n');
            // console.log(msg);
            console.log(opt.client);
            verifyQR(opt.code, entryIn)
                .then((obj) => {
                    io.emit(obj.eventName, { name: obj.name, client: opt.client, msg: obj.msg, details: obj.details });
                })
                .catch((obj) => {
                    io.emit(obj.eventName, { name: obj.name, msg: obj.msg, client: opt.client });
                });
        });

        socket.on('mode change', function (val) {
            entryIn = val;
        });



        socket.on('disconnect', function () {
            console.log('user disconnected');
        });
    });
}