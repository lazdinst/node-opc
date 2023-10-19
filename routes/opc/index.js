// routes/opc.js
const express = require("express");
const opcua = require("node-opcua");
const { browseNode, browseAndReadRecursively } = require("./utils")(opcua);

module.exports = (wss) => {
  const { wsSendAllClients } = require("./utils/ws")(wss);
  const router = express.Router();

  const SERVER_ENDPOINT = "opc.tcp://localhost:50000";
  const CERT_PATH = "./certificates/PKI/own/certs/cert.pem";
  const KEY_PATH = "./certificates/PKI/own/private/private_key.pem";

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

  client.on("connection_lost", (e) => {
    console.error("Connection lost. Attempting to reconnect...");
    console.error(e);
    attemptReconnection(client);
  });

  client.on("backoff", (retry, delay) => {
    console.log(
      `Retrying to connect to OPC server... Retry ${retry} in ${delay}ms`
    );
  });

  // Implement reconnection logic
  async function attemptReconnection(opcClient) {
    try {
      await opcClient.connect(SERVER_ENDPOINT);
      console.log("Reconnected successfully to the OPC Server.");
    } catch (err) {
      console.error(`Failed to reconnect: ${err.message || err}`);
      // Wait for a while before attempting to reconnect again.
      // This uses the backoff event to determine retries.
    }
  }

  (async () => {
    try {
      await client.connect(SERVER_ENDPOINT);
      console.log("Connected successfully to the OPC Server.");
    } catch (err) {
      console.error(`Initial connection failed: ${err.message || err}`);
    }
  })();

  router.get("/browse", async (req, res) => {
    try {
      await client.connect(SERVER_ENDPOINT);
      const session = await client.createSession();

      const nodes = await browseNode(session, "ns=0;i=84");

      await session.close();
      await client.disconnect();

      res.json(nodes);
    } catch (err) {
      res.send(`Failed to browse: ${err.message || err}`);
    }
  });

  router.get("/browse-boiler", async (req, res) => {
    try {
      const session = await client.createSession();
      const nodes = await browseAndReadRecursively(session, "ns=4;i=15070");

      await wsSendAllClients(nodes);

      await session.close();
      res.json(nodes);
    } catch (err) {
      res.send(`Failed to browse: ${err.message || err}`);
    }
  });

  process.on("exit", () => {
    if (client) {
      client.disconnect();
      console.log("Disconnected from the OPC server gracefully.");
    }
  });

  return router;
};
