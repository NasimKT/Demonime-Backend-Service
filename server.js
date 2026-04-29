const express = require("express");
const app = express();

app.get("/player", (req, res) => {
  const { id, ep } = req.query;

  res.send(`
    <html>
      <body style="margin:0;background:black;">
        <iframe 
          src="https://megaplay.buzz/stream/mal/${id}/${ep}/sub"
          width="100%" height="100%" frameborder="0" allowfullscreen>
        </iframe>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));
