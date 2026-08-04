const startButton = document.getElementById("startButton");
const camera = document.getElementById("camera");
const result = document.getElementById("result");

const settingsButton = document.getElementById("settingsButton");

let isAdjustMode = false;

startButton.addEventListener("click", async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: {
          ideal: "environment"
        }
      },
      audio: false
    });

    camera.srcObject = stream;

    result.textContent = "カメラ起動中";
    startButton.textContent = "カメラ起動済み";
    startButton.disabled = true;
  } catch (error) {
    console.error(error);

    result.textContent =
      "カメラを起動できませんでした。カメラの使用を許可してください。";
  }
});
const canvas = document.getElementById("captureCanvas");
const ctx = canvas.getContext("2d");
const details = document.getElementById("details");

const topCanvas = document.createElement("canvas");
const topCtx = topCanvas.getContext("2d");

const bottomCanvas = document.createElement("canvas");
const bottomCtx = bottomCanvas.getContext("2d");

const topPartCanvas = document.createElement("canvas");
const topPartCtx = topPartCanvas.getContext("2d");

const topBackCanvas = document.createElement("canvas");
const topBackCtx = topBackCanvas.getContext("2d");

const bottomPartCanvas = document.createElement("canvas");
const bottomPartCtx = bottomPartCanvas.getContext("2d");

const bottomBackCanvas = document.createElement("canvas");
const bottomBackCtx = bottomBackCanvas.getContext("2d");
let isReading = false;
function captureAutoAreas() {
  if (!camera.videoWidth || !camera.videoHeight) {
    return false;
  }

  const sourceWidth = camera.videoWidth;
  const sourceHeight = camera.videoHeight;

  const sideMargin = sourceWidth * 0.05;
  const usableWidth = sourceWidth - sideMargin * 2;

  const topY = sourceHeight * 0.08;
  const topHeight = sourceHeight * 0.38;

  const bottomY = sourceHeight * 0.54;
  const bottomHeight = sourceHeight * 0.38;

  topCanvas.width = Math.round(usableWidth);
  topCanvas.height = Math.round(topHeight);

  bottomCanvas.width = Math.round(usableWidth);
  bottomCanvas.height = Math.round(bottomHeight);

  topCtx.clearRect(0, 0, topCanvas.width, topCanvas.height);
  bottomCtx.clearRect(0, 0, bottomCanvas.width, bottomCanvas.height);

  topCtx.drawImage(
    camera,
    sideMargin,
    topY,
    usableWidth,
    topHeight,
    0,
    0,
    topCanvas.width,
    topCanvas.height
  );

  bottomCtx.drawImage(
    camera,
    sideMargin,
    bottomY,
    usableWidth,
    bottomHeight,
    0,
    0,
    bottomCanvas.width,
    bottomCanvas.height
  );

    const cropFromCanvas = (
    sourceCanvas,
    targetCanvas,
    targetCtx,
    xRatio,
    yRatio,
    widthRatio,
    heightRatio
  ) => {
    const sx = sourceCanvas.width * xRatio;
    const sy = sourceCanvas.height * yRatio;
    const sw = sourceCanvas.width * widthRatio;
    const sh = sourceCanvas.height * heightRatio;

    targetCanvas.width = Math.round(sw);
    targetCanvas.height = Math.round(sh);

    targetCtx.clearRect(
      0,
      0,
      targetCanvas.width,
      targetCanvas.height
    );

    targetCtx.drawImage(
      sourceCanvas,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      targetCanvas.width,
      targetCanvas.height
    );
  };

  // 上側：照合板
  cropFromCanvas(
    topCanvas,
    topPartCanvas,
    topPartCtx,
    0.35,
    0.05,
    0.60,
    0.28
  );

  cropFromCanvas(
    topCanvas,
    topBackCanvas,
    topBackCtx,
    0.05,
    0.05,
    0.28,
    0.32
  );

  // 下側：かんばん
  cropFromCanvas(
    bottomCanvas,
    bottomPartCanvas,
    bottomPartCtx,
    0.20,
    0.12,
    0.65,
    0.22
  );

  cropFromCanvas(
    bottomCanvas,
    bottomBackCanvas,
    bottomBackCtx,
    0.25,
    0.34,
    0.42,
    0.22
  );

  return true;
}
function captureCameraImage() {
  if (!camera.videoWidth || !camera.videoHeight) {
    return false;
  }

  const videoRect = camera.getBoundingClientRect();
  const topArea = document.querySelector(".ocr-area-top");
  const bottomArea = document.querySelector(".ocr-area-bottom");

  if (!topArea || !bottomArea) {
    return false;
  }

  const topRect = topArea.getBoundingClientRect();
  const bottomRect = bottomArea.getBoundingClientRect();

  const scaleX = camera.videoWidth / videoRect.width;
  const scaleY = camera.videoHeight / videoRect.height;

  const copyAreaToCanvas = (areaRect, targetCanvas, targetContext) => {
    const sourceX = Math.max(
      0,
      (areaRect.left - videoRect.left) * scaleX
    );

    const sourceY = Math.max(
      0,
      (areaRect.top - videoRect.top) * scaleY
    );

    const sourceWidth = Math.min(
      camera.videoWidth - sourceX,
      areaRect.width * scaleX
    );

    const sourceHeight = Math.min(
      camera.videoHeight - sourceY,
      areaRect.height * scaleY
    );

    if (sourceWidth <= 0 || sourceHeight <= 0) {
      return false;
    }

    targetCanvas.width = Math.round(sourceWidth);
    targetCanvas.height = Math.round(sourceHeight);

    targetContext.clearRect(
      0,
      0,
      targetCanvas.width,
      targetCanvas.height
    );

    targetContext.drawImage(
      camera,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      targetCanvas.width,
      targetCanvas.height
    );

    return true;
  };

  const topOk = copyAreaToCanvas(
    topRect,
    topCanvas,
    topCtx
  );

  const bottomOk = copyAreaToCanvas(
    bottomRect,
    bottomCanvas,
    bottomCtx
  );

  return topOk && bottomOk;
}
async function readTextFromImage() {
  if (isReading) return;

  if (!captureAutoAreas()) return;

  isReading = true;
  result.textContent = "文字を読み取り中...";

  try {
  const topPartOcr = await Tesseract.recognize(
  topPartCanvas,
  "eng"
);

const topBackOcr = await Tesseract.recognize(
  topBackCanvas,
  "eng"
);

const bottomPartOcr = await Tesseract.recognize(
  bottomPartCanvas,
  "eng"
);

const bottomBackOcr = await Tesseract.recognize(
  bottomBackCanvas,
  "eng"
);

const topPartNumber = extractPartNumber(
  topPartOcr.data.text
);

const topBackNumber = extractBackNumber(
  topBackOcr.data.text,
  ""
);

const bottomPartNumber = extractPartNumber(
  bottomPartOcr.data.text
);

const topBackNumber = extractBackNumber(
  topBackOcr.data.text,
  ""
);

const bottomPartNumber = extractPartNumber(
  bottomPartOcr.data.text
);

const bottomBackNumber = extractBackNumber(
  bottomBackOcr.data.text,
  ""
);

details.textContent =
  "上側\n" +
  "品番：" + (topPartNumber || "見つかりません") + "\n" +
  "背番：" + (topBackNumber || "見つかりません") +
  "\n\n下側\n" +
  "品番：" + (bottomPartNumber || "見つかりません") + "\n" +
  "背番：" + (bottomBackNumber || "見つかりません");

result.textContent = "品番・背番を抽出しました";
  } catch (error) {
    console.error(error);
    result.textContent = "OCRエラー";
  }

  isReading = false;
}
setInterval(() => {
  if (camera.srcObject && !isReading) {
    readTextFromImage();
  }
}, 5000);
function cleanOcrText(text) {
  return text
    .toUpperCase()
    .replace(/[‐-‒–—―ー]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPartNumber(text) {
  const cleaned = cleanOcrText(text);

  const matches = cleaned.match(/[A-Z0-9]+(?:-[A-Z0-9]+)+/g);

  if (!matches || matches.length === 0) {
    return "";
  }

  const candidates = matches
    .map(value => value.replace(/-00$/, ""))
    .filter(value => value.length >= 6);

  if (candidates.length === 0) {
    return "";
  }

  candidates.sort((a, b) => b.length - a.length);

  return candidates[0];
}

function extractBackNumber(text, partNumber) {
  const cleaned = cleanOcrText(text);

  const withoutPartNumber = partNumber
    ? cleaned.replace(partNumber, " ")
    : cleaned;

  const matches = withoutPartNumber.match(/[A-Z]{0,3}-?\d{2,4}|\d{2,4}-[A-Z]/g);

  if (!matches || matches.length === 0) {
    return "";
  }

  const candidates = matches.filter(value => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 2 && digits.length <= 4;
  });

  if (candidates.length === 0) {
    return "";
  }

  return candidates[0];
}
settingsButton.addEventListener("click", () => {
  isAdjustMode = !isAdjustMode;

  document.body.classList.toggle("adjust-mode", isAdjustMode);

  settingsButton.textContent = isAdjustMode
    ? "💾 調整を終了"
    : "⚙️ 枠の調整";

    if (!isAdjustMode) {
  saveOcrAreaPositions();
}
});
const ocrAreas = document.querySelectorAll(".ocr-area");

ocrAreas.forEach((area) => {
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  area.addEventListener("pointerdown", (event) => {
    if (!isAdjustMode) return;

    startX = event.clientX;
    startY = event.clientY;

    const rect = area.getBoundingClientRect();

    startLeft = rect.left;
    startTop = rect.top;

    area.setPointerCapture(event.pointerId);
  });

  area.addEventListener("pointermove", (event) => {
    if (!isAdjustMode) return;
    if (!area.hasPointerCapture(event.pointerId)) return;

    const moveX = event.clientX - startX;
    const moveY = event.clientY - startY;

    area.style.left = `${startLeft + moveX}px`;
    area.style.top = `${startTop + moveY}px`;
  });

  area.addEventListener("pointerup", (event) => {
    if (!isAdjustMode) return;

    area.releasePointerCapture(event.pointerId);
  });
});
function saveOcrAreaPositions() {
  const positions = [];

  ocrAreas.forEach((area) => {
    const rect = area.getBoundingClientRect();

    positions.push({
      left: area.style.left || `${rect.left}px`,
      top: area.style.top || `${rect.top}px`
    });
  });

  localStorage.setItem(
    "ocrAreaPositions",
    JSON.stringify(positions)
  );
}
function loadOcrAreaPositions() {
  const saved = localStorage.getItem("ocrAreaPositions");

  if (!saved) return;

  try {
    const positions = JSON.parse(saved);

    ocrAreas.forEach((area, index) => {
      const position = positions[index];

      if (!position) return;

      area.style.left = position.left;
      area.style.top = position.top;
    });
  } catch (error) {
    console.error("枠位置の復元に失敗しました。", error);
  }
}

window.addEventListener("load", () => {
  loadOcrAreaPositions();
});