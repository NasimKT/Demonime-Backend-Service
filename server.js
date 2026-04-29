const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
app.use(cors());

app.get("/stream", async (req, res) => {
  const { id, ep } = req.query;

  const url = `https://megaplay.buzz/stream/mal/${id}/${ep}/sub`;

  let browser;

  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2" });

    // grab video sources from page
    const stream = await page.evaluate(() => {
      const video = document.querySelector("video");
      if (video && video.src) return video.src;

      const source = document.querySelector("source");
      if (source && source.src) return source.src;

      return null;
    });

    if (!stream) {
      throw new Error("No stream found");
    }

    res.json({ url: stream });
  } catch (e) {
    res.status(500).json({ error: "Extraction failed" });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Running on", PORT));
