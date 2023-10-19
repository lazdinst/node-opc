require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");

const app = express();
const initializeWebSocket = require("./ws/websocketServer");

const server = http.createServer(app);
const wss = initializeWebSocket(server);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const opcRouter = require("./routes/opc")(wss);
app.use("/opc", opcRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: "Something went wrong!" });
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
