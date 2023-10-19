const WebSocket = require("ws");

module.exports = function (wss) {
  async function wsSendAllClients(data) {
    // Send nodes to all WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
  return {
    wsSendAllClients,
  };
};
