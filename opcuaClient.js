const express = require("express");
const opcua = require("node-opcua");
const fs = require("fs");

const app = express();

const SERVER_ENDPOINT = "opc.tcp://localhost:50000";
const CERT_PATH = "./certificates/PKI/own/certs/cert.pem";
const KEY_PATH = "./certificates/PKI/own/private/private_key.pem";

app.get("/connect", async (req, res) => {
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

  const client = opcua.OPCUAClient.create(options);

  try {
    await client.connect(SERVER_ENDPOINT);
    await client.disconnect();
    res.send("Connected successfully to the OPC Server.");
  } catch (err) {
    res.send(`Failed to connect: ${err.message || err}`);
  }
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
