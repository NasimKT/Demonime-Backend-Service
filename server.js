const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
app.use(cors());

const CHROME_PATH = "/opt/render/.cache/puppeteer/chrome/linux-127.0.6533.88/chrome-linux64/chrome";

app.get("/stream", async (req, res) => {
  const { id, ep } = req.query;

  console.log("---- NEW REQUEST ----");
  console.log("ID:", id, "EP:", ep);

  const url = `https://megaplay.buzz/stream/mal/${id}/${ep}/sub`;
  console.log("URL:", url);
  console.log("Using Chrome at:", CHROME_PATH);

  let browser;

  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

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
