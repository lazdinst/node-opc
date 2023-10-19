const opcua = require("node-opcua");
const SERVER_ENDPOINT = process.env.SERVER_ENDPOINT;

function createClientInstance() {
  try {
    const CERT_PATH = process.env.CERT_PATH;
    const KEY_PATH = process.env.KEY_PATH;

    const options = {
      applicationName: "node-opc-client",
      connectionStrategy: {
        timeout: 5000,
      },
      securityMode: opcua.MessageSecurityMode.SignAndEncrypt,
      securityPolicy: opcua.SecurityPolicy.Basic256Sha256,
      endpointMustExist: false,
      certificateFile: CERT_PATH,
      privateKeyFile: KEY_PATH,
    };

    const client = opcua.OPCUAClient.create(options);
    return client;
  } catch (error) {
    console.error("Error during client creation:", error.message || error);
    throw error;
  }
}

function setClientEventListeners(client, callBack, callBackDelay = 3000) {
  client.on("connection_lost", async (e) => {
    console.error(
      `Connection lost. Will attempt to reconnect in ${callBackDelay} seconds...`
    );
    console.error(e);
    await callBack(client);
  });

  client.on("backoff", (retry, delay) => {
    console.log(
      `Retrying to connect to OPC server... Retry ${retry} in ${delay}ms`
    );
  });
}

async function attemptReconnection(client) {
  if (client.isReconnecting || client.isConnected()) {
    console.log(
      "Client is already reconnecting or connected. Skipping reconnection attempt."
    );
    return;
  }

  try {
    await connectClient(client);
    console.log("Reconnected successfully to the OPC Server.");
  } catch (err) {
    console.error(`Failed to reconnect: ${err.message || err}`);
  }
}

// Expose a function to initiate the connection.
async function connectClient(client) {
  try {
    await client.connect(SERVER_ENDPOINT);
    console.log("Connected successfully to the OPC Server.");
  } catch (err) {
    console.error(`Initial connection failed: ${err.message || err}`);
  }
}

module.exports = {
  connectClient,
  createClientInstance,
  attemptReconnection,
  setClientEventListeners,
};
