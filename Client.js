var fs = require('fs'),
    pb = require('pretty-bytes'),
    c = require('chalk'),
    Spinner = require('node-spinner'),
    io = require('socket.io-client'),
    ss = require('socket.io-stream'),
    clear = require('cli-clear'),
    async = require('async'),
    _ = require('underscore');
var magnet = process.argv[2];
host = process.argv[3] || 'localhost';
var port = process.argv[4] || 4911;
var spin = new Spinner();

var url = process.argv[5];


var socket = io.connect('http://' + host + ':' + port + '/fileRequest');
var iS = null;
var sent = 0;

var dFile = __dirname + '/streamHttpFile_tester';
var stream = ss.createStream();
var sent = 0;
stream.on('data', function(chunk) {
    sent = chunk.length + sent;
    var m = '\r' + c.green('chunked') + ' ' + spin.next();
    process.stdout.write(m);
});
stream.on('end', function() {
    console.log('\nstream ended. sent ', pb(sent));
});
console.log('emitting');
ss(socket).emit('streamHttpFile', stream, {
    url: url,
});
stream.pipe(fs.createWriteStream(dFile));
/*
socket.emit('1magnet', magnet, function(err, Files) {
    if (err) throw err;
    console.log('Files', Files);
    _.each(Files, function(file) {
        var dFile = __dirname + '/dFile_' + file.name;
        console.log('requesting stream for file ', file, 'to', dFile);
        var stream = ss.createStream();
        stream.on('data', function(chunk) {
            sent = chunk.length + sent;
            var m = '\r' + c.green('chunked') + ' ' + spin.next();
            process.stdout.write(m);
        });
        stream.on('end', function() {
            console.log('\nstream ended. sent ', pb(sent));
        });
        ss(socket).emit('streamMagnetFile', stream, {
            magnet: magnet,
            file: file
        });
        stream.pipe(fs.createWriteStream(dFile));
    });
});
*/
