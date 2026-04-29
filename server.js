const express = require("express");
const app = express();

app.get("/player", (req, res) => {
  const { id, ep = 1, lang = "sub" } = req.query;

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>
body {
  margin:0;
  background:black;
  overflow:hidden;
  font-family: Arial;
}

iframe {
  position:absolute;
  width:100%;
  height:100%;
  border:none;
}

/* overlay brightness */
#overlay {
  position:absolute;
  width:100%;
  height:100%;
  background:black;
  opacity:0;
  pointer-events:none;
}

/* controls */
.controls {
  position:absolute;
  bottom:0;
  width:100%;
  padding:15px;
  background: linear-gradient(transparent, rgba(0,0,0,0.9));
  transition: opacity 0.3s;
}

.hidden {
  opacity:0;
}

/* top title */
.title {
  position:absolute;
  top:15px;
  left:15px;
  color:white;
}

/* center tap feedback */
.feedback {
  position:absolute;
  top:50%;
  left:50%;
  transform:translate(-50%,-50%);
  color:white;
  font-size:28px;
  opacity:0;
  transition:opacity 0.2s;
}

/* progress */
input[type=range] {
  width:100%;
}

/* side indicators */
.side-indicator {
  position:absolute;
  top:50%;
  transform:translateY(-50%);
  color:white;
  font-size:20px;
  opacity:0;
}
.left { left:20px; }
.right { right:20px; }

</style>
</head>

<body>

<div id="overlay"></div>

<div class="title">Episode ${ep}</div>

<iframe id="player"
src="https://megaplay.buzz/stream/mal/${id}/${ep}/${lang}">
</iframe>

<div class="controls" id="controls">
  <input type="range" id="seek" value="0">
</div>

<div id="feedback" class="feedback"></div>
<div id="left" class="side-indicator left"></div>
<div id="right" class="side-indicator right"></div>

<script>

let controls = document.getElementById("controls");
let feedback = document.getElementById("feedback");
let overlay = document.getElementById("overlay");

let lastTap = 0;
let hideTimeout;
let brightness = 0;
let volume = 50;
let seek = 0;

// ===== AUTO HIDE =====
function showControls() {
  controls.classList.remove("hidden");
  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => {
    controls.classList.add("hidden");
  }, 2500);
}

document.body.addEventListener("click", showControls);
showControls();

// ===== DOUBLE TAP =====
document.body.addEventListener("touchend", (e) => {
  let now = Date.now();
  let x = e.changedTouches[0].clientX;
  let width = window.innerWidth;

  if (now - lastTap < 300) {
    if (x < width / 2) {
      showFeedback("⏪ 10s");
    } else {
      showFeedback("⏩ 10s");
    }
  }
  lastTap = now;
});

// ===== SWIPE =====
let startX = 0;
let startY = 0;

document.body.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
});

document.body.addEventListener("touchmove", (e) => {
  let dx = e.touches[0].clientX - startX;
  let dy = e.touches[0].clientY - startY;

  // horizontal → seek
  if (Math.abs(dx) > Math.abs(dy)) {
    seek += dx * 0.1;
    showFeedback("⏩ " + Math.floor(seek) + "s");
  }

  // vertical
  else {
    let x = startX;
    let width = window.innerWidth;

    // right side → volume
    if (x > width / 2) {
      volume -= dy * 0.1;
      showRight("🔊 " + Math.floor(volume));
    }
    // left side → brightness
    else {
      brightness += dy * 0.002;
      brightness = Math.max(0, Math.min(0.8, brightness));
      overlay.style.opacity = brightness;
      showLeft("☀ " + Math.floor((1 - brightness) * 100));
    }
  }

  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
});

// ===== UI HELPERS =====
function showFeedback(text) {
  feedback.innerText = text;
  feedback.style.opacity = 1;
  setTimeout(() => feedback.style.opacity = 0, 600);
}

function showLeft(text) {
  let el = document.getElementById("left");
  el.innerText = text;
  el.style.opacity = 1;
  setTimeout(() => el.style.opacity = 0, 600);
}

function showRight(text) {
  let el = document.getElementById("right");
  el.innerText = text;
  el.style.opacity = 1;
  setTimeout(() => el.style.opacity = 0, 600);
}

</script>

</body>
</html>
`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));