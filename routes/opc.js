// routes/opc.js
const express = require("express");
const opcua = require("node-opcua");

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

async function testOpcServerConnection() {
  const client = opcua.OPCUAClient.create(options);

  try {
    await client.connect(SERVER_ENDPOINT);
    await client.disconnect();
    return "Connected successfully to the OPC Server.";
  } catch (err) {
    throw new Error(`Failed to connect: ${err.message || err}`);
  }
}

async function browseNode(session, nodeId) {
  const browseResult = await session.browse(nodeId);
  let nodes = [];

  for (const reference of browseResult.references) {
    nodes.push({
      nodeId: reference.nodeId.toString(),
      browseName: reference.browseName.toString(),
      nodeClass: opcua.NodeClass[reference.nodeClass],
      typeDefinition: reference.typeDefinition
        ? reference.typeDefinition.toString()
        : null,
    });

    // Recursively browse child nodes
    const childNodes = await browseNode(session, reference.nodeId);
    nodes = nodes.concat(childNodes);
  }

  return nodes;
}

// Define your route handlers
router.get("/connect", async (req, res) => {
  try {
    const message = await testOpcServerConnection();
    res.send(message);
  } catch (err) {
    res.send(err.message || err);
  }
});

router.get("/browse", async (req, res) => {
  const client = opcua.OPCUAClient.create(options);

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

router.get("/boiler-details", async (req, res) => {
  const client = opcua.OPCUAClient.create(options);
  const boilerNodeId = "ns=4;i=5017"; // Boiler #2 NodeId

  try {
    await client.connect(SERVER_ENDPOINT);
    const session = await client.createSession();

    // Browse the Boiler #2 node to get child nodes
    const browseResult = await session.browse(boilerNodeId);

    // Forming ReadValueId objects
    const nodesToRead = browseResult.references.map((ref) => ({
      nodeId: ref.nodeId,
      attributeId: opcua.AttributeIds.Value,
    }));

    const readResults = await session.read(nodesToRead);

    const boilerDetails = readResults.map((dataValue, index) => ({
      nodeName: browseResult.references[index].browseName.toString(),
      value: dataValue.value ? dataValue.value.value : null,
    }));

    await session.close();
    await client.disconnect();

    res.json(boilerDetails);
  } catch (err) {
    res.send(`Failed to fetch boiler details: ${err.message || err}`);
  }
});

const browseAndReadRecursively = async (session, nodeId) => {
  try {
    const browseResult = await session.browse(nodeId);

    if (!browseResult || !browseResult.references) {
      return [];
    }

    const results = [];
    for (const reference of browseResult.references) {
      const node = {
        nodeId: reference.nodeId.toString(),
        browseName: reference.browseName.toString(),
        nodeClass: opcua.NodeClass[reference.nodeClass],
        typeDefinition: reference.typeDefinition
          ? reference.typeDefinition.toString()
          : null,
      };

      if (reference.nodeClass === opcua.NodeClass.Variable) {
        try {
          const dataValue = await session.read({
            nodeId: reference.nodeId,
            attributeId: opcua.AttributeIds.Value,
          });
          node.value = dataValue.value ? dataValue.value.value : null;
        } catch (err) {
          node.value = `Error reading value: ${err.message}`;
        }
      }

      const childNodes = await browseAndReadRecursively(
        session,
        reference.nodeId
      );
      results.push(node, ...childNodes);
    }

    return results;
  } catch (err) {
    console.error(`Error in browsing and reading recursively: ${err.message}`);
    return [];
  }
};

// Express endpoint
router.get("/browse-boiler", async (req, res) => {
  const client = opcua.OPCUAClient.create(options);

  try {
    await client.connect(SERVER_ENDPOINT);
    const session = await client.createSession();

    const nodes = await browseAndReadRecursively(session, "ns=4;i=15070");

    await session.close();
    await client.disconnect();

    res.json(nodes);
  } catch (err) {
    res.send(`Failed to browse: ${err.message || err}`);
  }
});

module.exports = router;
