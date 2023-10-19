const opcua = require("node-opcua");

const SERVER_ENDPOINT = process.env.SERVER_ENDPOINT;
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

client.on("connection_lost", async (e) => {
  console.error("Connection lost. Will attempt to reconnect in 10 seconds...");
  console.error(e);
  setTimeout(() => attemptReconnection(client), 10000); // Delaying the reconnection by 10 seconds.
});

client.on("backoff", (retry, delay) => {
  console.log(
    `Retrying to connect to OPC server... Retry ${retry} in ${delay}ms`
  );
});

async function attemptReconnection(opcClient) {
  try {
    await opcClient.connect(SERVER_ENDPOINT);
    console.log("Reconnected successfully to the OPC Server.");
  } catch (err) {
    console.error(`Failed to reconnect: ${err.message || err}`);
  }
}

// Expose a function to initiate the connection.
async function connect() {
  try {
    await client.connect(SERVER_ENDPOINT);
    console.log("Connected successfully to the OPC Server.");
  } catch (err) {
    console.error(`Initial connection failed: ${err.message || err}`);
  }
}

module.exports = {
  client,
  connect,
};
