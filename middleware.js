'use strict';
const fs = require('fs');
const Ini = require('ini');
const express = require('express');
const proxy = require('http-proxy-middleware');
const app = express();
const config = Ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
const { exec } = require('child_process');

const wsProxy = proxy('/socket.io', config.socketio);
app.use(wsProxy);
app.use('/socket.io', wsProxy);

app.use('/', proxy(config.static));

console.log(`Listening to http://localhost:${config.port}`);
const server = app.listen(Number(config.port));
server.on('upgrade', wsProxy.upgrade);
exec(`http-server -c-1 -p ${config.static.port} ./static`);
