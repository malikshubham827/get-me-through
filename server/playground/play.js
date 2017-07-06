// To play with packages and check the use cases
// let PythonShell = require('python-shell');
// var pyshell = new PythonShell('my_script.py',{
//   pythonOptions: '-u' //disable python output buffering
// });
var spawn = require('child_process').spawn,
    py    = spawn('python', ['my_script.py']);

py.stdout.on('data', function(data){
    console.log(" got from py " + data.toString() );
});
py.stdout.on('end', function(){
    console.log(' byyee ');
});
var stdin = process.openStdin();
var callback = function(d) {
    d = d.toString().trim();
    if(d=="q") {
        console.log('going to shut down');
        py.stdin.end();
        py.kill("SIGHUP");
        stdin.removeListener('data',callback);
        process.stdin.pause();
    }
}
stdin.addListener("data", callback);
