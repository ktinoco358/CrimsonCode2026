/* Copyright 2023 The MediaPipe Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");

const uiCanvas = document.getElementById("ui_canvas");
const uiCtx = uiCanvas ? uiCanvas.getContext("2d") : null;


const pencil = document.getElementById("pencil");
const homeButton = document.getElementById("homePage");

let handLandmarker = undefined;
let webcamRunning = false;
let trackingEnabled = false;
let isCanvasSized = false;
let lastVideoTime = -1;
let dwellStartTime = null;
const DWELL_DURATION = 1000; 
let isClicked = false;
let fingerPos = { x: 0, y: 0 }; 
let isHandPresent = false;
let brushColor = "black";
let currentTool = "pen"; 
let currentShape = "square";

// setupt
const setup = async () => {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
    });
    startCamera();
};

const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.addEventListener("loadeddata", () => {
        webcamRunning = true;
        if (!pencil) trackingEnabled = true; 
        predictWebcam();
    });
};

// buttons
if (pencil) {
    pencil.addEventListener("click", () => {
        trackingEnabled = !trackingEnabled;
    });
}

if (homeButton) {
    homeButton.addEventListener("click", () => { window.location.href = "index.html"; });
}


const drawingGameBtn = document.getElementById("drawingGame");
if (drawingGameBtn) {
    drawingGameBtn.addEventListener("click", () => { window.location.href = "drawingApp.html"; });
}

async function predictWebcam() {
    if (!isCanvasSized && video.videoWidth > 0) {
        canvasElement.width = window.innerWidth;
        canvasElement.height = window.innerHeight;
        if (uiCanvas) {
            uiCanvas.width = window.innerWidth;
            uiCanvas.height = window.innerHeight;
        }
        isCanvasSized = true;
    }

    if (uiCtx) uiCtx.clearRect(0, 0, uiCanvas.width, uiCanvas.height);
    
    if (!pencil) {
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }


    // toolbar buttons
    if (pencil && !isClicked) { 
        const setupBtn = (id, type, val) => {
            const btn = document.getElementById(id);
            if (btn) btn.onclick = () => { 
                if (type === "tool") currentTool = val;
                if (type === "shape") currentShape = val;
                if (type === "clear") canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            };
        };
        setupBtn("pencil", "tool", "pen");
        setupBtn("eraser", "tool", "eraser");
        setupBtn("square", "shape", "square");
        setupBtn("circle", "shape", "circle");
        setupBtn("triangle", "shape", "triangle");
        setupBtn("clear", "clear");
    }

    let startTimeMs = performance.now();
    
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        const results = handLandmarker.detectForVideo(video, startTimeMs);

        if (results.landmarks && results.landmarks.length > 0) {
            isHandPresent = true;
            const hand = results.landmarks[0];
            
            
            fingerPos.x = (1 - hand[8].x) * canvasElement.width;
            fingerPos.y = hand[8].y * canvasElement.height;
            
            const allBtns = document.querySelectorAll("button");
            let isOverAnyButton = false;

            allBtns.forEach(btn => {
                const rect = btn.getBoundingClientRect();
                if (fingerPos.x >= rect.left && fingerPos.x <= rect.right && 
                    fingerPos.y >= rect.top && fingerPos.y <= rect.bottom) {
                    
                    isOverAnyButton = true;
                    if (!dwellStartTime) dwellStartTime = Date.now();
                    const elapsed = Date.now() - dwellStartTime;

                    if (elapsed >= DWELL_DURATION && !isClicked) {
                        btn.click(); 
                        if (btn.parentElement && btn.parentElement.id === "paintColors") {
                            brushColor = window.getComputedStyle(btn).backgroundColor;
                        }
                        isClicked = true;
                        dwellStartTime = null;
                    }
                }
            });

            if (!isOverAnyButton) {
                dwellStartTime = null;
                isClicked = false;
            }
        } else {
            isHandPresent = false;
            dwellStartTime = null;
        }
    }

    if (isHandPresent) {

        //paint
        if (trackingEnabled && pencil) {
            canvasCtx.fillStyle = (currentTool === "eraser") ? "#d5d0c7" : brushColor;
            const size = 15;

            if (currentShape === "square") {
                canvasCtx.fillRect(fingerPos.x - size/2, fingerPos.y - size/2, size, size);
            } else if (currentShape === "circle") {
                canvasCtx.beginPath();
                canvasCtx.arc(fingerPos.x, fingerPos.y, size/2, 0, Math.PI * 2);
                canvasCtx.fill();
            } else if (currentShape === "triangle") {
                canvasCtx.beginPath();
                canvasCtx.moveTo(fingerPos.x, fingerPos.y - size/2);
                canvasCtx.lineTo(fingerPos.x - size/2, fingerPos.y + size/2);
                canvasCtx.lineTo(fingerPos.x + size/2, fingerPos.y + size/2);
                canvasCtx.fill();
            }
        }

        //curser
        if (uiCtx) {
            if (dwellStartTime) {
                const elapsed = Date.now() - dwellStartTime;
                uiCtx.beginPath();
                uiCtx.arc(fingerPos.x, fingerPos.y, 25, 0, (elapsed / DWELL_DURATION) * Math.PI * 2);
                uiCtx.strokeStyle = "#4CAF50";
                uiCtx.lineWidth = 5;
                uiCtx.stroke();
            }
            uiCtx.beginPath();
            uiCtx.arc(fingerPos.x, fingerPos.y, 15, 0, Math.PI * 2);
            uiCtx.strokeStyle = "black";
            uiCtx.lineWidth = 2;
            uiCtx.stroke();
        }
    }

    if (webcamRunning) window.requestAnimationFrame(predictWebcam);
}


setup();