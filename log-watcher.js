const fs = require('fs');
const md5 = require('md5');
var https = require('https');
var WebSocket = require('ws');
const readLastLines = require('read-last-lines');
const options = {
  key: fs.readFileSync('/etc/ssl/private/private.key'),
  cert: fs.readFileSync('/etc/ssl/certs/certificate.crt'),
};
var server = https.createServer(options, function(request, response) {});
server.listen(8444, function() { });

const wss = new WebSocket.Server({ server });

wsConnections = [];
lastMessages = [];

wss.on('connection', function connection(conn) {
  wsConnections.push(conn);
  conn.send(JSON.stringify(lastMessages));
});

// Set this to your server's log path
const serverLog = '/pluto/storage/iw5/games_mp.log';

function parseEvent(event) {
  event = event.replace(/[0-9]+:[0-9]+\s/g, '').trim();
  var eventRegex = {
    /* https://github.com/RaidMax/IW4M-Admin/blob/2.4-pr/Application/EventParsers/BaseEventParser.cs :) */
    say: /^(say|sayteam);(-?[A-Fa-f0-9_]{1,32}|bot[0-9]+|0);([0-9]+);([^;]*);(.*)$/g,
    join: /^(J);(-?[A-Fa-f0-9_]{1,32}|bot[0-9]+|0);([0-9]+);(.*)$/g,
    quit: /^(Q);(-?[A-Fa-f0-9_]{1,32}|bot[0-9]+|0);([0-9]+);(.*)$/g,
    kill: /^(K);(-?[A-Fa-f0-9_]{1,32}|bot[0-9]+|0);(-?[0-9]+);(axis|allies|world|none)?;([^;]{1,24});(-?[A-Fa-f0-9_]{1,32}|bot[0-9]+|0)?;(-?[0-9]+);(axis|allies|world|none)?;([^;]{1,24})?;((?:[0-9]+|[a-z]+|_|\+)+);([0-9]+);((?:[A-Z]|_)+);((?:[a-z]|_)+)$/g
  }
  eventData = null;
  Object.entries(eventRegex).forEach((r) => {
    // Removing stuff like guid or other unnecessary things
    if (event.match(r[1])) {
      var eventVars =  event.split(';')
      switch (r[0]) {
        case 'say':
          eventData = {type: r[0], data: [eventVars[3], eventVars[4]]};
        break;
        case 'quit':
        case 'join':
          eventData = {type: r[0], data: [eventVars[3]]};
        break;
        case 'kill':
          eventData = {type: r[0], data: [eventVars[3], eventVars[4], eventVars[7], eventVars[8], eventVars[9]]};
        break;
      }
    }
  })
  return eventData;
}

var previousMD5;

fs.watch(serverLog, async (event, filename) => {
  if (filename) {
    var lastLine = await readLastLines.read(serverLog, 1)
    var event = parseEvent(lastLine)
    var currentMD5 = md5(await readLastLines.read(serverLog, 10))

    console.log(event, currentMD5)

    if (!event || previousMD5 == currentMD5) return;

    previousMD5 = currentMD5;
    lastMessages.push(event);
    lastMessages.length > 30 && lastMessages.shift();

    wsConnections.forEach(client => {
      client.send(JSON.stringify([event]))
    });
  } 
});
