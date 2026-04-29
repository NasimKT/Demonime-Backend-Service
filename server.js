const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
app.use(cors());

app.get("/stream", async (req, res) => {
  const { id, ep } = req.query;

  console.log("---- NEW REQUEST ----");
  console.log("ID:", id, "EP:", ep);

  const url = `https://megaplay.buzz/stream/mal/${id}/${ep}/sub`;
  console.log("URL:", url);

  let browser;

  try {
    console.log("Launching browser...");

    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    console.log("Opening page...");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    console.log("Extracting video...");

    const stream = await page.evaluate(() => {
      const video = document.querySelector("video");
      if (video && video.src) return video.src;

      const source = document.querySelector("source");
      if (source && source.src) return source.src;

      return null;
    });

    console.log("STREAM:", stream);

    if (!stream) throw new Error("No stream found");

    res.json({ url: stream });

  } catch (e) {
    console.log("❌ ERROR:", e.message);
    res.status(500).json({ error: "Extraction failed", details: e.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(10000, () => console.log("Running on 10000"));
