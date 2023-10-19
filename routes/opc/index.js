// routes/opc.js
const express = require("express");
const opcua = require("node-opcua");
const { browseNode, browseAndReadRecursively } = require("./utils/opc")(opcua);
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

  return router;
};
