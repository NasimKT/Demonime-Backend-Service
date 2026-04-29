const axios = require("axios");

async function getStream(malId, episode) {
  const url = `https://megaplay.buzz/stream/mal/${malId}/${episode}/sub`;

  const res = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "Referer": "https://megaplay.buzz/",
    },
  });

  const html = res.data;

  const match = html.match(/file:\s*"(.*?)"/);

  if (!match) throw new Error("Stream not found");

  return match[1];
}

module.exports = { getStream };
