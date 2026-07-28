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

  return true;
}
async function readTextFromImage() {
  if (isReading) return;

  if (!captureCameraImage()) return;

  isReading = true;
  result.textContent = "文字を読み取り中...";

  try {
    const ocr = await Tesseract.recognize(
      canvas,
      "jpn+eng"
    );

    details.textContent = ocr.data.text;
    result.textContent = "読み取り完了";
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