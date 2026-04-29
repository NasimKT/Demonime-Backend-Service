const express = require("express");
const cors = require("cors");
const { chromium } = require("playwright");
const { execSync } = require("child_process");

try {
  execSync("npx playwright install chromium", { stdio: "inherit" });
} catch (e) {
  console.log("playwright install warning:", e.message);
}

const app = express();
app.use(cors());

// DEBUG: log all requests to find stream URL pattern
app.get("/debug", async (req, res) => {
  const { id, ep } = req.query;
  const url = `https://megaplay.buzz/stream/mal/${id}/${ep}/sub`;

  let browser;
  const allRequests = [];

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    });

    page.on("request", (request) => {
      const u = request.url();
      const type = request.resourceType();
      // capture media, xhr, fetch requests
      if (["media", "xhr", "fetch", "other"].includes(type)) {
        allRequests.push({ type, url: u });
      }
    });

    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.mouse.click(300, 300);
    await page.waitForTimeout(10000);

    res.json({ total: allRequests.length, requests: allRequests });

  } catch (e) {
    res.status(500).json({ error: e.message, captured: allRequests });
  } finally {
    if (browser) await browser.close();
  }
});

app.get("/stream", async (req, res) => {
  res.json({ message: "use /debug?id=5114&ep=1 first to find stream pattern" });
});

app.listen(10000, () => console.log("Running on 10000"));
