// server.js
const express = require("express");
const cors = require("cors");
const { chromium } = require("playwright");

const app = express();
app.use(cors());

app.get("/stream", async (req, res) => {
  const { id, ep } = req.query;

  console.log("---- NEW REQUEST ----");
  console.log("ID:", id, "EP:", ep);

  const url = `https://megaplay.buzz/stream/mal/${id}/${ep}/sub`;

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });

    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    });

    let streamUrl = null;

    page.on("response", async (response) => {
      const u = response.url();
      if (!streamUrl && (u.includes(".m3u8") || u.includes(".mp4"))) {
        streamUrl = u;
      }
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Wait up to 15s for network stream to appear
    await page.waitForTimeout(15000);

    // Fallback: check DOM
    if (!streamUrl) {
      streamUrl = await page.evaluate(() => {
        const video = document.querySelector("video");
        if (video?.src) return video.src;
        const source = document.querySelector("source");
        return source?.src ?? null;
      });
    }

    console.log("STREAM:", streamUrl);

    if (!streamUrl) throw new Error("No stream found");

    res.json({ url: streamUrl });

  } catch (e) {
    console.log("❌ ERROR:", e.message);
    res.status(500).json({ error: "Extraction failed", details: e.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(10000, () => console.log("Running on 10000"));
