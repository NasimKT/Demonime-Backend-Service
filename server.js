const express = require("express");
const cors = require("cors");
const { getStream } = require("./extractor");

const app = express();
app.use(cors());

app.get("/stream", async (req, res) => {
  try {
    const { id, ep } = req.query;

    const stream = await getStream(id, ep);

    res.json({ url: stream });
  } catch (e) {
    res.status(500).json({ error: "Failed to extract stream" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on", PORT));
