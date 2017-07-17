module.exports = function (io) {

    var pid = -1;
    var sendUpdates = false;

    io.on('connection', function (socket) {
        console.log('a user connected', socket.id);

        function sendLiveUpdates() {
            var spawn = require('child_process').spawn,
                py = spawn('python', [String(__dirname) + '/../py/run.py']);

            // Store pid of py to kill if client needs
            pid = py.pid;

            py.stdout.on('data', function (data1) {
                data = data1.toString();
                var a = data, arr=[];
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
                    if(s!= '')
                        arr.push(s);
                }
                if(arr.length == 0) {
                    arr.push('Unknown');
                }
                data = JSON.stringify(arr);
                console.log(" got from py " + data);
                if (sendUpdates) {
                    io.emit('new liveUpdates', data);
                }

            });
            py.stdout.on('end', function () {
                console.log(' byyee ');
            });
            py.stderr.on('data', (data) => {
                console.log(`stderr: ${data}`);
                io.emit('start error');
            });

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

        socket.on('disconnect', function () {
            console.log('user disconnected');
        });
    });
}