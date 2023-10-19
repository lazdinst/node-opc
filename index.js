const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();

// Create an HTTP server
const server = http.createServer(app);

// Create a WebSocket server by passing the HTTP server instance to 'ws'
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);
  });

  ws.send("Hello from server!");
});

// Middleware and configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import and use the OPC-related routes
const opcRouter = require("./routes/opc")(wss);
app.use("/opc", opcRouter);

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
