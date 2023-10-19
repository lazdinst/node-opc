const WebSocket = require("ws");

function initializeWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("message", (message) => {
      console.log(`Received message: ${message}`);
    });

    ws.send("Hello from server!");
  });

  return wss;
}

module.exports = initializeWebSocket;
