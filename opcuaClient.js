const express = require("express");
const opcua = require("node-opcua");
const fs = require("fs");

const app = express();

const SERVER_ENDPOINT = "opc.tcp://localhost:50000";
const CERT_PATH = "./certificates/PKI/own/certs/cert.pem";
const KEY_PATH = "./certificates/PKI/own/private/private_key.pem";

const options = {
  applicationName: "NodeOPCUAClient",
  connectionStrategy: {
    timeout: 5000,
  },
  securityMode: opcua.MessageSecurityMode.SignAndEncrypt,
  securityPolicy: opcua.SecurityPolicy.Basic256Sha256,
  endpointMustExist: false,
  certificateFile: CERT_PATH,
  privateKeyFile: KEY_PATH,
};

app.get("/connect", async (req, res) => {
  const client = opcua.OPCUAClient.create(options);

  try {
    await client.connect(SERVER_ENDPOINT);
    await client.disconnect();
    res.send("Connected successfully to the OPC Server.");
  } catch (err) {
    res.send(`Failed to connect: ${err.message || err}`);
  }
});

app.get("/browse", async (req, res) => {
  const client = opcua.OPCUAClient.create(options);

  try {
    await client.connect(SERVER_ENDPOINT);

    // Create session
    const session = await client.createSession();

    // Browse the root folder
    const browseResult = await session.browse("RootFolder");

    // Disconnect session and client after browsing
    await session.close();
    await client.disconnect();

    // Convert browse results to JSON
    const nodes = browseResult.references.map((reference) => {
      return {
        nodeId: reference.nodeId.toString(),
        browseName: reference.browseName.toString(),
        nodeClass: opcua.NodeClass[reference.nodeClass],
        typeDefinition: reference.typeDefinition
          ? reference.typeDefinition.toString()
          : null,
      };
    });

    res.json(nodes);
  } catch (err) {
    res.send(`Failed to browse: ${err.message || err}`);
  }
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
