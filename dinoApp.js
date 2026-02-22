import { HandLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const demosSection = document.getElementById("demos");
let handLandmarker = undefined;
let runningMode = "IMAGE";
let webcamRunning = false;

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
    if (canvasElement.width !== window.innerWidth) {
        canvasElement.width = window.innerWidth;
        canvasElement.height = window.innerHeight;
    }

    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await handLandmarker.setOptions({ runningMode: "VIDEO" });
    }

    let startTimeMs = performance.now();
    const results = handLandmarker.detectForVideo(video, startTimeMs);

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.landmarks) {
        results.landmarks.forEach((hand) => {
            const indexTip = hand[8];

        const pixelX = (1 - indexTip.x) * canvasElement.width;
        const pixelY = indexTip.y * canvasElement.height;


        const backBtn = document.getElementById("backToHome");
        if (backBtn) {
            const rect = backBtn.getBoundingClientRect();
            if (pixelX >= rect.left && pixelX <= rect.right && 
                pixelY >= rect.top && pixelY <= rect.bottom) {
                
                window.location.href = "index.html";
            }
        }

        if (indexTip.y < 0.4) { 
            if (window.dinoJump) window.dinoJump();
        }

        canvasCtx.fillStyle = "#D3D3D3";
        canvasCtx.beginPath();
        canvasCtx.arc(pixelX, pixelY, 10, 0, Math.PI * 2);
        canvasCtx.fill();
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

createHandLandmarker().then(() => {
    startWebcamAutomatically();
});