// To play with packages and check the use cases
// let PythonShell = require('python-shell');
// var pyshell = new PythonShell('my_script.py',{
//   pythonOptions: '-u' //disable python output buffering
// });
console.log('hii');
console.log(__dirname);
var spawn = require('child_process').spawn,
    py = spawn('python', [String(__dirname) + '/my_script.py'], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });
// py    = spawn('python', [String(__dirname) +'/feed_data.py']);
var stdin = process.openStdin();

function exitHandler(data, signal) {
    // res.sendStatus(200);
    console.log('suc ' + data + ' ' + signal);
}
function errorHandler(data, signal) {
    // res.sendStatus(418);
    console.log('err ' + data + signal);
}
py.addListener('close', exitHandler);
py.addListener('error', errorHandler);

py.stdout.on('data', function (data) {
    console.log(" got from py " + data);
});
py.stdout.on('end', function () {
    console.log(' byyee ');
});
py.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
});
py.on('message', function (msg) {
    console.log(`got message from child: ${msg}.`)
})


var callback = function (d) {
    d = d.toString().trim();
    console.log('call:' + d);
    if (d == "q") {
        console.log('going to shut down');
        py.stdin.end();
        py.kill("SIGHUP");
        stdin.removeListener('data', callback);
        process.stdin.pause();
    }
}
stdin.addListener("data", callback);
