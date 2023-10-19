// const opcua = require("node-opcua");
const SERVER_ENDPOINT = process.env.SERVER_ENDPOINT;

module.exports = function (opcua) {
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
      throw error; // You can re-throw the error if you want the caller to be aware of it.
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

  async function attemptReconnection(opcClient) {
    if (opcClient.isReconnecting || opcClient.isConnected()) {
      console.log(
        "Client is already reconnecting or connected. Skipping reconnection attempt."
      );
      return;
    }

    try {
      await opcClient.connect(SERVER_ENDPOINT);
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

  async function browseAndReadRecursively(session, nodeId) {
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
      console.error(
        `Error in browsing and reading recursively: ${err.message}`
      );
      return [];
    }
  }

  return {
    browseNode,
    connectClient,
    createClientInstance,
    attemptReconnection,
    setClientEventListeners,
    browseAndReadRecursively,
  };
};
