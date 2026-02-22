import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const toggleButton = document.getElementById("webcamButton");

let handLandmarker = undefined;
let webcamRunning = false;
let trackingEnabled = false; 
let isCanvasSized = false;
let lastVideoTime = -1;
let dwellStartTime = null;
const DWELL_DURATION = 1000;
let isClicked = false;
let brushColor = "black"; // Default color

// 1. Initialize AI and then Start Camera
const setup = async () => {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2
    });
};

const video = document.getElementById("webcam");

const translation = document.getElementById("userTranslation");

const userCanvas = document.getElementById("output_canvas");
const userCan = userCanvas.getContext("2d");

const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const enableWebcamButton = document.getElementById("webcamButton");


async function predictWebcam() {
    if (!isCanvasSized && video.videoWidth > 0) {
        canvasElement.width = window.innerWidth;
        canvasElement.height = window.innerHeight;
        isCanvasSized = true;
    }

    let startTimeMs = performance.now();
    
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        const results = handLandmarker.detectForVideo(video, startTimeMs);

    //canvasCtx.save();
    //canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.landmarks) {
        const drawingUtils = new DrawingUtils(canvasCtx); // Create the helper

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


                    if (elapsed >= DWELL_DURATION && !isClicked) {
                        btn.click();
                        // If it's a color button, update the brush
                        const style = window.getComputedStyle(btn);
                        brushColor = style.backgroundColor;
                        
                        isClicked = true;
                        dwellStartTime = null;
                    }
                }
            });

        // 2. Access specific points (Landmarks)
        // Let's get the Index Finger Tip (Landmark #8)
        const indexTip = hand[8];
     
        // 3. Print the normalized coordinates (0.0 to 1.0)
        console.log(`Index Tip - X: ${indexTip.x.toFixed(2)}, Y: ${indexTip.y.toFixed(2)}`);

        const widthT = userCanvas.width;
        const heightT = userCanvas.height;

        // 4. Convert to actual pixel positions for your screen
        const pixelX = Math.round(indexTip.x * widthT);
        const pixelY = Math.round(indexTip.y * heightT);
        
        console.log(`Canvas Resolution: ${widthT} x ${heightT}`);
        
        console.log(`Finger is at Pixel: ${pixelX}px, ${pixelY}px`);

        // Draw a red box at the fingertip
        const boxSize = 40;
        canvasCtx.fillStyle = "rgba(255, 0, 0, 0.7)";
        canvasCtx.fillRect(
            pixelX - boxSize / 2,
            pixelY - boxSize / 2,
            boxSize,
            boxSize
            );

        //Tigger the jump
        if (indexTip.y < 0.5) {
            // We call the function from your Phaser file
            if (typeof window.dinoJump === "function") {
                window.dinoJump();
            }
        }
    });
    }

    if (webcamRunning) {
        window.requestAnimationFrame(predictWebcam);
    }
    canvasCtx.restore();
}

async function startWebcamAutomatically() {
    if (!handLandmarker) return;

    const constraints = {
        video: { width: 1920, height: 1080 }
    };

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
