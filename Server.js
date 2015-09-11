var fs = require('fs'),
    pb = require('pretty-bytes'),
    request = require('request'),
    c = require('chalk');
var _ = require('underscore');
host = process.argv[2] || '127.0.0.1';
var port = process.argv[3] || 4911;
var io = require('socket.io').listen(port);
var ss = require('socket.io-stream');
var path = require('path');
var file = __dirname + '/file';
var torrentStream = require('torrent-stream');
var spinner = require('node-spinner');
var iS = null;
var clear = require('cli-clear');

var elegantSpinner = require('elegant-spinner');
var logUpdate = require('log-update');


io.of('/fileRequest').on('connection', function(socket) {
    console.log('socket ev');
    socket.on('end', function() {
        console.log('SOCKET ENDED');
    });
    socket.on('magnet', function(magnet, _cb) {
        var Spin = new spinner();
        var m = c.green.dim('Magnet -> Files request received. Connecting to torrent. ');
        iS = setInterval(function() {
            process.stdout.write('\r' + m + c.blue(Spin.next()));
        }, 100);
        var engine = torrentStream(magnet);
        engine.on('ready', function() {
            clearInterval(iS);
            process.stdout.write('\n');
            var m = 'Magnet Ready. Sending Files ';
            var Files = engine.files.map(function(f) {
                return {
                    name: f.name,
                    path: f.path,
                    length: f.length,
                };
            });
            _cb(null, Files);
            process.stdout.write('\nSent ' + Files.length + '\n');
        });
    });
    ss(socket).on('streamHttpFile', function(stream, data) {
        var sentBytes = 0;
        var frame = elegantSpinner();
var fileSize=0;
        request.get(data.url).on('response', function(response) {
		fileSize=response.headers['content-length'];
            var m = 'response received: ' + response.statusCode + ' File Size: ' + fileSize + ' ' + frame();
            logUpdate(m);
        }).on('end', function() {
            var m = 'Completed  ' + pb(sentBytes);
            logUpdate(m + ' ' + frame());
        }).on('data', function(data) {
            sentBytes += data.length;
            var m = 'Downloading ' + frame() + ' ' + pb(sentBytes) + ' / ' + pb(parseInt(fileSize));
            logUpdate(m);
        }).on('error', function(er) {
            console.log(er);
        }).pipe(stream);
    });
    ss(socket).on('streamMagnetFile', function(stream, data) {
        var engine = torrentStream(data.magnet);
        console.log('connecting to', data.magnet.length, ' ');
        engine.on('ready', function() {
            console.log('magnet', data.magnet.length, 'ready');
            var sentBytes = 0;
            engine.files.forEach(function(file) {
                if (file.name != data.file.name) return;
                console.log('sending file', file.name);
                var torrentStream = file.createReadStream();
                torrentStream.on('upload', function(index, offset, length) {
                    console.log('uploaded index ', index, 'offset', offset, 'length', length);
                });
                torrentStream.on('download', function(index) {
                    console.log('downloaded index ', index);
                });
                torrentStream.on('data', function(chunk) {
                    sentBytes = sentBytes + chunk.length;
                    console.log('sent ', chunk.length, 'total sent:', sentBytes, 'file size', file.length);
                });
                torrentStream.on('end', function() {
                    console.log('stream ended. total sent: ', sentBytes);
                });
                torrentStream.on('start', function() {
                    console.log('start');
                });
                torrentStream.pipe(stream);
            });
        });
    });
});
