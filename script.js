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

topCanvas.width = canvas.width;
topCanvas.height = halfHeight;

bottomCanvas.width = canvas.width;
bottomCanvas.height = halfHeight;

topCtx.drawImage(
  canvas,
  0,
  0,
  canvas.width,
  halfHeight,
  0,
  0,
  topCanvas.width,
  topCanvas.height
);

bottomCtx.drawImage(
  canvas,
  0,
  halfHeight,
  canvas.width,
  halfHeight,
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

details.textContent =
  "上側：" + topOcr.data.text +
  "\n\n下側：" + bottomOcr.data.text;

result.textContent = "上下の読み取り完了";
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