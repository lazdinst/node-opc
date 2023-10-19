const {
  createClientInstance,
  connectClient,
  setClientEventListeners,
  attemptReconnection,
} = require("./utils/opcClient");

let client = createClientInstance();
setClientEventListeners(client, attemptReconnection, 5000);
connectClient(client);

process.on("exit", async () => {
  if (client) {
    try {
      await client.disconnect();
      console.log("Disconnected from the OPC server gracefully.");
    } catch (error) {
      console.error("Error disconnecting from the OPC server:", error);
    }

    client = createClientInstance();
    setClientEventListeners(client, attemptReconnection, 5000);
    connectClient(client);
  }
});

module.exports = {
  client,
};
