import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const demosSection = document.getElementById("demos");
let handLandmarker = undefined;
let runningMode = "IMAGE";
let webcamRunning = false;

// Initialize the Landmarker
const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
        },
        runningMode: runningMode,
        numHands: 2
    });
};
createHandLandmarker();

const video = document.getElementById("webcam");
const userCanvas = document.getElementById("output_canvas");
const userCan = userCanvas.getContext("2d");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const enableWebcamButton = document.getElementById("webcamButton");

async function predictWebcam() {
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;

    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await handLandmarker.setOptions({ runningMode: "VIDEO" });
    }

    let startTimeMs = performance.now();
    const results = handLandmarker.detectForVideo(video, startTimeMs);

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.landmarks) {
        const drawingUtils = new DrawingUtils(canvasCtx);

        for (const landmarks of results.landmarks) {
            drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                color: "#00FF00",
                lineWidth: 5
            });
            drawingUtils.drawLandmarks(landmarks, {
                color: "#FF0000",
                lineWidth: 2
            });
        }

        results.landmarks.forEach((hand) => {
            const indexTip = hand[8];
            const widthT = userCanvas.width;
            const heightT = userCanvas.height;
            const pixelX = Math.round(indexTip.x * widthT);
            const pixelY = Math.round(indexTip.y * heightT);

            if (indexTip.y < 0.5) {
                window.dinoJump();
            }

            console.log(`Canvas Resolution: ${widthT} x ${heightT}`);
            console.log(`Finger is at Pixel: ${pixelX}px, ${pixelY}px`);

            // Draw a red box at the fingertip
            const boxSize = 40;
            canvasCtx.fillStyle = "rgba(255, 0, 0, 0.7)";
            canvasCtx.fillRect(pixelX - boxSize / 2, pixelY - boxSize / 2, boxSize, boxSize);
        });
    }

    canvasCtx.restore();

    if (webcamRunning) {
        window.requestAnimationFrame(predictWebcam);
    }
}

async function startWebcamAutomatically() {
    if (!handLandmarker) return;

    const constraints = { video: { width: 1920, height: 1080 } };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    video.addEventListener("loadeddata", () => {
        webcamRunning = true;
        predictWebcam();
    });
}

// Start automatically once the model is ready
createHandLandmarker().then(() => {
    startWebcamAutomatically();
});