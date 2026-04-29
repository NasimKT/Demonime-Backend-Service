const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
app.use(cors());

app.get("/stream", async (req, res) => {
  const { id, ep } = req.query;

  const url = `https://megaplay.buzz/stream/mal/${id}/${ep}/sub`;

  let browser;

  console.log("---- NEW REQUEST ----");
  console.log("ID:", id, "EP:", ep);
  console.log("URL:", url);

  try {
    console.log("Launching browser...");

    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });

    const page = await browser.newPage();

    console.log("Setting user agent...");
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    // 🔥 LOG NETWORK REQUESTS
    page.on("request", req => {
      console.log("➡️ Request:", req.url());
    });

    page.on("response", res => {
      console.log("⬅️ Response:", res.url(), res.status());
    });

    console.log("Opening page...");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    console.log("Page loaded.");

    // 🔥 dump partial HTML for debugging
    const html = await page.content();
    console.log("HTML length:", html.length);

    if (html.length < 5000) {
      console.log("⚠️ Suspicious small HTML (maybe blocked)");
      console.log(html.substring(0, 1000));
    }

    console.log("Trying to extract video...");

    const stream = await page.evaluate(() => {
      const videos = document.querySelectorAll("video");
      for (let v of videos) {
        if (v.src) return v.src;
      }

      const sources = document.querySelectorAll("source");
      for (let s of sources) {
        if (s.src) return s.src;
      }

      return null;
    });

    console.log("Extracted stream:", stream);

    if (!stream) {
      console.log("❌ No stream found in DOM");
      throw new Error("No stream found");
    }

    res.json({ url: stream });

  } catch (e) {
    console.error("❌ ERROR:", e.message);
    res.status(500).json({ error: "Extraction failed", details: e.message });
  } finally {
    if (browser) {
      console.log("Closing browser...");
      await browser.close();
    }
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Running on", PORT));
