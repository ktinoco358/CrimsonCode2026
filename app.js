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

    // Remove the "invisible" class so we can see the app
    document.getElementById("demos").classList.remove("invisible");
    startCamera();
};

const startCamera = async () => {
    try {
        const constraints = { video: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.addEventListener("loadeddata", () => {
            webcamRunning = true;
            predictWebcam();
        });
    } catch (err) {
        console.error("Camera access denied!", err);
    }
};

// 2. Toggle Tracking (The "Enable Webcam" button now toggles the AI)
toggleButton.addEventListener("click", () => {
    trackingEnabled = !trackingEnabled;
});

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

        if (trackingEnabled && results.landmarks && results.landmarks.length > 0) {
            const hand = results.landmarks[0];
            const indexTip = hand[8];
    
            const mirroredX = (1 - indexTip.x) * canvasElement.width;
            const pixelY = indexTip.y * canvasElement.height;
            const pixelX = indexTip.x * canvasElement.width;
    
            // Detect all buttons (Main button + Color buttons)
            const allButtons = document.querySelectorAll("button");
            let isOverAnyButton = false;

            allButtons.forEach(btn => {
                const rect = btn.getBoundingClientRect();
                
                if (mirroredX >= rect.left && mirroredX <= rect.right && 
                    pixelY >= rect.top && pixelY <= rect.bottom) {
                    
                    isOverAnyButton = true;
                    if (!dwellStartTime) dwellStartTime = Date.now();
                    const elapsed = Date.now() - dwellStartTime;


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

            if (!isOverAnyButton) {
                dwellStartTime = null;
                isClicked = false;
            }


            // Draw a simple cursor so you can see where you are pointing
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = "rgba(0,0,0,0.5)";
            canvasCtx.beginPath();
            canvasCtx.arc(mirroredX, pixelY, 10, 0, Math.PI * 2);
            canvasCtx.stroke();


            
            // Draw the brush
            canvasCtx.fillStyle = brushColor;
            canvasCtx.fillRect(mirroredX - 5, pixelY - 5, 10, 10);
        }
    }

    if (webcamRunning) {
        window.requestAnimationFrame(predictWebcam);
    }
}

// Kick off the script
setup();