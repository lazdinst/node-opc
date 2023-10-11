const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/opcdata", async (req, res) => {
  try {
    res.json({ data: "test" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch OPC UA data.");
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
