const express = require("express");
const app = express();
const opcRouter = require("./routes/opc"); // Import the OPC-related routes

// Middleware and configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/opc", opcRouter);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
