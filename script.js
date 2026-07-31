const startButton = document.getElementById("startButton");
const camera = document.getElementById("camera");
const result = document.getElementById("result");

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
let isReading = false;
function captureCameraImage() {
  if (!camera.videoWidth || !camera.videoHeight) {
    return false;
  }

  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;

  ctx.drawImage(
    camera,
    0,
    0,
    canvas.width,
    canvas.height
  );
  const halfHeight = canvas.height / 2;

  const cropX = canvas.width * 0.15;
const cropWidth = canvas.width * 0.70;
const cropHeight = halfHeight * 0.60;
const cropY = halfHeight * 0.20;

topCanvas.width = cropWidth;
topCanvas.height = cropHeight;

bottomCanvas.width = cropWidth;
bottomCanvas.height = cropHeight;

topCtx.drawImage(
  canvas,
  cropX,
  cropY,
  cropWidth,
  cropHeight,
  0,
  0,
  topCanvas.width,
  topCanvas.height
);

bottomCtx.drawImage(
  canvas,
  cropX,
  halfHeight + cropY,
  cropWidth,
  cropHeight,
  0,
  0,
  bottomCanvas.width,
  bottomCanvas.height
);

  return true;
}
async function readTextFromImage() {
  if (isReading) return;

  if (!captureCameraImage()) return;

  isReading = true;
  result.textContent = "文字を読み取り中...";

  try {
    const topOcr = await Tesseract.recognize(
  topCanvas,
  "jpn+eng"
);

const bottomOcr = await Tesseract.recognize(
  bottomCanvas,
  "jpn+eng"
);

const topPartNumber = extractPartNumber(topOcr.data.text);
const topBackNumber = extractBackNumber(
  topOcr.data.text,
  topPartNumber
);

const bottomPartNumber = extractPartNumber(bottomOcr.data.text);
const bottomBackNumber = extractBackNumber(
  bottomOcr.data.text,
  bottomPartNumber
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