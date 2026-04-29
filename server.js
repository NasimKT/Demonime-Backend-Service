const express = require("express");
const cors = require("cors");
const { chromium } = require("playwright");
const { execSync } = require("child_process");

// Install browser at runtime (survives Render's build/deploy split)
try {
  execSync("npx playwright install chromium", { stdio: "inherit" });
} catch (e) {
  console.log("playwright install warning:", e.message);
}

const app = express();
app.use(cors());

app.get("/stream", async (req, res) => {
  const { id, ep } = req.query;

  const url = `https://megaplay.buzz/stream/mal/${id}/${ep}/sub`;

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    });

    let streamUrl = null;

    // 🔥 capture ALL requests (not just response)
    page.on("request", (req) => {
      const u = req.url();
      if (!streamUrl && (u.includes(".m3u8") || u.includes(".mp4"))) {
        console.log("🎯 FOUND STREAM:", u);
        streamUrl = u;
      }
    });

    console.log("Opening page...");
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

    // 🔥 simulate user click (IMPORTANT)
    try {
      await page.mouse.click(300, 300);
      console.log("Clicked player");
    } catch {}

    // 🔥 wait longer for network
    for (let i = 0; i < 20; i++) {
      if (streamUrl) break;
      await page.waitForTimeout(1000);
    }

    // fallback DOM check
    if (!streamUrl) {
      streamUrl = await page.evaluate(() => {
        const video = document.querySelector("video");
        if (video?.src) return video.src;
        const source = document.querySelector("source");
        return source?.src ?? null;
      });
    }

    console.log("FINAL STREAM:", streamUrl);

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
