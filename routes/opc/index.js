// routes/opc.js
const express = require("express");
const opcua = require("node-opcua");
const {
  browseNode,
  monitorNode,
  simpleBrowse,
  stopMonitoring,
  browseAndReadRecursively,
} = require("./utils/opcMethods");
const { client } = require("./client");

module.exports = (wss) => {
  const { wsSendAllClients } = require("../../ws/utils/ws")(wss);
  const router = express.Router();

  router.get("/browse", async (req, res) => {
    try {
      const session = await client.createSession();
      const nodes = await browseNode(session, "ns=0;i=84");
      await session.close();

      res.json(nodes);
    } catch (err) {
      next(err); // Pass the error to the middleware
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

  router.get("/monitor-boiler", async (req, res) => {
    try {
      const session = await client.createSession();
      const { subscription, monitoredItems } = await monitorNode({
        session,
        nodeId: "ns=4;i=15070",
        onChange: wsSendAllClients,
      });

      const childNodes = await simpleBrowse(session, "ns=4;i=15070");
      console.log("Children of BoilerStatus:", childNodes);

      setTimeout(async () => {
        await stopMonitoring({ subscription, monitoredItems, session });
        await session.close();
        console.log("Stopped monitoring and closed session.");
      }, 10000);

      res.json(null);
    } catch (err) {
      res.send(`Failed to browse: ${err.message || err}`);
    }
  });

  router.post("/heater-on", async (req, res) => {
    try {
      const session = await client.createSession();
      const callMethodRequest = {
        objectId: opcua.coerceNodeId("ns=3;s=Methods"),
        methodId: opcua.coerceNodeId("ns=4;s=HeaterOn"),
        inputArguments: [],
      };
      const results = await session.call(callMethodRequest);

      if (results.statusCode.isGood()) {
        res.json({
          status: "success",
          message: "Heater turned on successfully.",
        });
      } else {
        res
          .status(500)
          .json({ status: "error", message: "Failed to turn on heater." });
      }

      await session.close();
    } catch (err) {
      console.error(err);

      res
        .status(500)
        .send(`Failed to call HeaterOn method: ${err.message || err}`);
    }
  });

  router.post("/heater-off", async (req, res) => {
    try {
      const session = await client.createSession();
      const callMethodRequest = {
        objectId: opcua.coerceNodeId("ns=3;s=Methods"),
        methodId: opcua.coerceNodeId("ns=4;s=HeaterOff"),
        inputArguments: [], // If the method requires arguments, put them here
      };
      const results = await session.call(callMethodRequest);

      if (results.statusCode.isGood()) {
        res.json({
          status: "success",
          message: "Heater turned off successfully.",
        });
      } else {
        res
          .status(500)
          .json({ status: "error", message: "Failed to turn off heater." });
      }

      await session.close();
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .send(`Failed to call HeaterOff method: ${err.message || err}`);
    }
  });

  async function browseNode(session, nodeId) {
    const browseResult = await session.browse(nodeId);
    let nodeInfo = {
      nodeId: nodeId,
      browseName: browseResult.browseName
        ? browseResult.browseName.toString()
        : "",
      nodeClass: opcua.NodeClass[browseResult.nodeClass] || "",
      children: [],
      result: browseResult,
    };

    if (browseResult.references) {
      for (const reference of browseResult.references) {
        const childNodeId = reference.nodeId.toString();
        const childNodeInfo = await browseNode(session, childNodeId);
        nodeInfo.children.push(childNodeInfo);
      }
    }

    return nodeInfo;
  }

  async function createServerTree(session) {
    const rootNodeIds = [opcua.resolveNodeId("RootFolder")];

    let tree = [];
    for (let rootId of rootNodeIds) {
      tree.push(await browseNode(session, rootId));
    }

    return tree;
  }

  router.get("/tree", async (req, res) => {
    try {
      const session = await client.createSession();
      const tree = await createServerTree(session);
      await session.close();
      res.json(tree);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
