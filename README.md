# Cod-Livefeed
Listens for server log file changes and sends the parsed events (join / leave, kills and messages) to every client connected to the websocket
# Usage
```bash
node log-watcher.js
```

Example output
```json
  [
  {
      "type": "kill", 
      "data": 
      [
        "axis",
        "fed",
        "axis",
        "anotherfed",
        "iw5_p90_mp_silencer_camo03"
      ]
   },
     {
      "type": "say", 
      "data": 
      [
        "fed",
        "hello"
      ]
   },
     {
      "type": "quit", 
      "data": 
      [
        "fed"
      ]
     }
   ]
```

Frontend
```javascript
  var socket = new WebSocket(`wss://${window.location.hostname}:8444`);
  socket.onmessage = function(e) {
    var msg = JSON.parse(e.data);
    msg.forEach(async (m) => {
      // Do whatever...
    })
   }
```
