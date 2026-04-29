const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/stream", async (req, res) => {
  const { id, ep } = req.query;
  const url = `https://megaplay.buzz/stream/mal/${id}/${ep}/sub`;
  res.json({ url });
});

// Proxy the page to bypass CORS/hotlink issues
app.get("/player", (req, res) => {
  const { id, ep } = req.query;
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; }
          iframe { width: 100vw; height: 100vh; border: none; }
        </style>
      </head>
      <body>
        <iframe 
          src="https://megaplay.buzz/stream/mal/${id}/${ep}/sub"
          allowfullscreen
          allow="autoplay; fullscreen"
        ></iframe>
      </body>
    </html>
  `);
});

app.listen(10000, () => console.log("Running on 10000"));
